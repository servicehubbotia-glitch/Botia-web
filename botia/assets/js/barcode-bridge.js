// BOTIA — Web barcode capture + return flow.
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const requestedLang = String(params.get("lang") || document.documentElement.lang || "en")
    .trim()
    .toLowerCase();

  const fallback = {
    camera_preparing: "Preparing camera…",
    camera_scanning: "Camera ready. Hold the barcode inside the frame.",
    camera_denied: "Camera access is unavailable. Use a photo or enter the digits manually.",
    detector_unavailable: "Automatic barcode reading is not available in this browser. Enter the digits manually.",
    photo_unavailable: "This browser cannot read a barcode from a photo automatically. Enter the digits manually.",
    no_code_in_photo: "No supported barcode was found in that photo.",
    invalid_code: "That number is not a valid GTIN/EAN/UPC barcode.",
    unsupported_length: "BOTIA accepts GTIN-8, GTIN-12, GTIN-13 and GTIN-14.",
    accepted: "Barcode validated.",
    detected_label: "Barcode read",
    type_prefix: "Format"
  };

  const el = id => document.getElementById(id);
  const video = el("video");
  const cameraState = el("camera_state");
  const status = el("status");
  const photoBtn = el("photo_btn");
  const photoInput = el("photo_input");
  const cancelBtn = el("cancel_btn");
  const manualInput = el("manual_input");
  const manualBtn = el("manual_btn");
  const detectedBox = el("detected_box");
  const detectedCode = el("detected_code");
  const detectedType = el("detected_type");

  let labels = fallback;
  let stream = null;
  let detector = null;
  let scanning = false;
  let scanTimer = null;

  const setStatus = (message, kind = "") => {
    status.textContent = message || "";
    status.className = `status${kind ? " " + kind : ""}`;
  };

  const loadLabels = async () => {
    const load = async lang => {
      const r = await fetch(`/i18n/${encodeURIComponent(lang)}/barcode_capture.json`, {
        cache: "no-store"
      });
      if (!r.ok) throw new Error(`barcode_capture ${r.status}`);
      return r.json();
    };
    try {
      labels = { ...fallback, ...(await load(requestedLang)) };
    } catch (_) {
      if (requestedLang !== "en") {
        try { labels = { ...fallback, ...(await load("en")) }; } catch (_) {}
      }
    }
  };

  const digitsOnly = value => String(value || "").replace(/\D/g, "");

  const gtinType = digits => ({
    8: "GTIN-8 / EAN-8",
    12: "GTIN-12 / UPC-A",
    13: "GTIN-13 / EAN-13",
    14: "GTIN-14"
  }[digits.length] || "");

  // GS1 modulo-10 check digit. The final digit is the check digit.
  const hasValidCheckDigit = digits => {
    if (![8, 12, 13, 14].includes(digits.length) || !/^\d+$/.test(digits)) return false;
    const body = digits.slice(0, -1);
    const expected = Number(digits.at(-1));
    let sum = 0;
    let weight = 3;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += Number(body[i]) * weight;
      weight = weight === 3 ? 1 : 3;
    }
    const check = (10 - (sum % 10)) % 10;
    return check === expected;
  };

  const normalize = raw => {
    const digits = digitsOnly(raw);
    if (![8, 12, 13, 14].includes(digits.length)) {
      return { ok: false, code: "unsupported_length", digits };
    }
    if (!hasValidCheckDigit(digits)) {
      return { ok: false, code: "invalid_code", digits };
    }
    return {
      ok: true,
      digits,
      gtin14: digits.padStart(14, "0"),
      type: gtinType(digits)
    };
  };

  const safeReturnUrl = () => {
    const raw = params.get("return");
    if (!raw) return null;
    try {
      const url = new URL(raw, location.origin);
      if (url.origin !== location.origin) return null;
      return url;
    } catch (_) {
      return null;
    }
  };

  const finish = (rawCode, format = "unknown", source = "web") => {
    const result = normalize(rawCode);
    if (!result.ok) {
      setStatus(labels[result.code] || labels.invalid_code, "error");
      return false;
    }

    stopCamera();
    detectedCode.textContent = result.digits;
    detectedType.textContent = `${labels.type_prefix}: ${result.type}`;
    detectedBox.classList.add("show");
    setStatus(labels.accepted, "success");

    const target = safeReturnUrl() || new URL("/ingredients/traceability.html", location.origin);
    target.searchParams.set("gtin", result.digits);
    target.searchParams.set("gtin14", result.gtin14);
    target.searchParams.set("barcode_format", format || result.type);
    target.searchParams.set("barcode_source", source);
    if (!target.searchParams.get("lang")) target.searchParams.set("lang", requestedLang);

    // Preserve context when this page was opened directly.
    for (const key of ["market", "product", "theme", "source"]) {
      const value = params.get(key);
      if (value && !target.searchParams.get(key)) target.searchParams.set(key, value);
    }

    window.setTimeout(() => {
      location.replace(target.toString());
    }, 380);
    return true;
  };

  const stopCamera = () => {
    scanning = false;
    if (scanTimer) window.clearTimeout(scanTimer);
    scanTimer = null;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (video) video.srcObject = null;
  };

  const scanFrame = async () => {
    if (!scanning || !detector || !video || video.readyState < 2) {
      if (scanning) scanTimer = window.setTimeout(scanFrame, 260);
      return;
    }
    try {
      const found = await detector.detect(video);
      if (Array.isArray(found)) {
        for (const item of found) {
          const raw = String(item.rawValue || "");
          if (finish(raw, item.format || "camera", "web_camera")) return;
        }
      }
    } catch (_) {
      // A single failed frame is not a user-visible error.
    }
    if (scanning) scanTimer = window.setTimeout(scanFrame, 260);
  };

  const createDetector = async () => {
    if (!("BarcodeDetector" in window)) return null;
    try {
      const supported = typeof BarcodeDetector.getSupportedFormats === "function"
        ? await BarcodeDetector.getSupportedFormats()
        : [];
      const preferred = ["ean_8", "ean_13", "upc_a", "itf"];
      const formats = preferred.filter(f => supported.length === 0 || supported.includes(f));
      return formats.length
        ? new BarcodeDetector({ formats })
        : new BarcodeDetector();
    } catch (_) {
      return null;
    }
  };

  const startCamera = async () => {
    detector = await createDetector();
    if (!detector) {
      cameraState.textContent = labels.detector_unavailable;
      photoBtn.disabled = true;
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraState.textContent = labels.camera_denied;
      return;
    }
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      video.srcObject = stream;
      await video.play().catch(() => {});
      cameraState.textContent = labels.camera_scanning;
      scanning = true;
      scanFrame();
    } catch (_) {
      cameraState.textContent = labels.camera_denied;
    }
  };

  const scanPhoto = async file => {
    if (!file) return;
    detector = detector || await createDetector();
    if (!detector) {
      setStatus(labels.photo_unavailable, "error");
      return;
    }
    try {
      const bitmap = await createImageBitmap(file);
      const found = await detector.detect(bitmap);
      bitmap.close?.();
      if (Array.isArray(found)) {
        for (const item of found) {
          if (finish(item.rawValue, item.format || "photo", "web_photo")) return;
        }
      }
      setStatus(labels.no_code_in_photo, "error");
    } catch (_) {
      setStatus(labels.no_code_in_photo, "error");
    } finally {
      photoInput.value = "";
    }
  };

  const cancel = () => {
    stopCamera();
    const target = safeReturnUrl();
    if (target) location.replace(target.toString());
    else if (history.length > 1) history.back();
    else location.href = "/";
  };

  const init = async () => {
    await loadLabels();
    cameraState.textContent = labels.camera_preparing;

    photoBtn.addEventListener("click", () => photoInput.click());
    photoInput.addEventListener("change", () => scanPhoto(photoInput.files?.[0]));
    cancelBtn.addEventListener("click", cancel);
    manualBtn.addEventListener("click", () => finish(manualInput.value, "manual", "manual"));
    manualInput.addEventListener("input", () => {
      manualInput.value = digitsOnly(manualInput.value).slice(0, 14);
      setStatus("");
    });
    manualInput.addEventListener("keydown", event => {
      if (event.key === "Enter") finish(manualInput.value, "manual", "manual");
    });

    await startCamera();
  };

  window.addEventListener("pagehide", stopCamera, { once: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
