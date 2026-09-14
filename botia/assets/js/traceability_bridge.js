// BOTIA — shared Traceability bridge for Animal / Woman / Mashbooh WebViews.
(() => {
  "use strict";

  const ALLOWED_MODULES = new Set(["animal_origin", "woman_safefood", "mashbooh"]);
  const module = document.body?.dataset?.botiaModule || "";
  if (!ALLOWED_MODULES.has(module)) return;
  if (document.getElementById("botia-traceability-bridge")) return;

  const params = new URLSearchParams(location.search);
  const lang = String(params.get("lang") || document.documentElement.lang || "en")
    .trim()
    .toLowerCase();
  const gtin = String(params.get("gtin") || "").trim();
  const market = String(params.get("market") || "").trim();
  const product = String(params.get("product") || "").trim();
  const theme = String(params.get("theme") || "").trim();
  const returnUrl = location.pathname + location.search + location.hash;

  const fallback = {
    title: "Product traceability",
    with_gtin: "This analysis already has a product barcode. Open the available traceability for this product.",
    without_gtin: "Add the barcode to check whether verifiable product traceability is available.",
    open_traceability: "View product traceability",
    add_barcode: "Add barcode",
    barcode_present: "Barcode available",
    barcode_missing: "Barcode not supplied"
  };

  const loadLabels = async () => {
    const load = async code => {
      const r = await fetch(`/i18n/${encodeURIComponent(code)}/traceability_bridge.json`, {
        cache: "no-store"
      });
      if (!r.ok) throw new Error(`traceability_bridge ${r.status}`);
      return r.json();
    };

    try {
      return { ...fallback, ...(await load(lang)) };
    } catch (_) {
      if (lang === "en") return fallback;
      try {
        return { ...fallback, ...(await load("en")) };
      } catch (_) {
        return fallback;
      }
    }
  };

  const injectStyle = () => {
    if (document.getElementById("botia-traceability-bridge-style")) return;
    const style = document.createElement("style");
    style.id = "botia-traceability-bridge-style";
    style.textContent = `
      #botia-traceability-bridge {
        margin: 8px 0 34px;
        padding: 18px;
        background: rgba(24,13,13,.92);
        border: 1px solid rgba(190,122,72,.34);
        border-radius: 16px;
        text-align: left;
      }
      #botia-traceability-bridge .btb-kicker {
        color: #e6a06b;
        font-size: .72rem;
        font-weight: 800;
        letter-spacing: .13em;
        text-transform: uppercase;
        margin-bottom: 8px;
      }
      #botia-traceability-bridge .btb-copy {
        color: #c0a08c;
        font-size: .92rem;
        line-height: 1.55;
        margin: 0 0 14px;
      }
      #botia-traceability-bridge .btb-meta {
        color: #8a8a8a;
        font-size: .77rem;
        line-height: 1.45;
        margin: -4px 0 14px;
      }
      #botia-traceability-bridge .btb-action {
        width: 100%;
        display: block;
        appearance: none;
        border: 1px solid rgba(230,160,107,.55);
        border-radius: 12px;
        background: rgba(190,122,72,.14);
        color: #ffd8bd;
        padding: 13px 16px;
        font: inherit;
        font-size: .92rem;
        font-weight: 700;
        text-align: center;
        text-decoration: none;
        cursor: pointer;
      }
      #botia-traceability-bridge .btb-action:focus-visible {
        outline: 2px solid #ffd8bd;
        outline-offset: 3px;
      }
      #botia-traceability-bridge .btb-status {
        color: #8a8a8a;
        font-size: .76rem;
        line-height: 1.45;
        margin: 10px 0 0;
      }
    `;
    document.head.appendChild(style);
  };

  const buildTraceabilityUrl = () => {
    const url = new URL("/ingredients/traceability.html", location.origin);
    url.searchParams.set("lang", lang);
    url.searchParams.set("gtin", gtin);
    url.searchParams.set("source", module);
    url.searchParams.set("return", returnUrl);
    if (market) url.searchParams.set("market", market);
    if (product) url.searchParams.set("product", product);
    if (theme) url.searchParams.set("theme", theme);
    return url.toString();
  };

  const buildBarcodeCaptureUrl = () => {
    const url = new URL("/ingredients/barcode_capture.html", location.origin);
    url.searchParams.set("lang", lang);
    url.searchParams.set("source", module);
    url.searchParams.set("return", returnUrl);
    if (market) url.searchParams.set("market", market);
    if (product) url.searchParams.set("product", product);
    if (theme) url.searchParams.set("theme", theme);
    return url.toString();
  };

  const requestBarcode = (button) => {
    const detail = {
      action: "request-barcode",
      sourceModule: module,
      returnUrl,
      lang,
      market,
      product,
      theme,
      fallbackUrl: buildBarcodeCaptureUrl()
    };

    // Stable DOM hook for a future Flutter/native barcode adapter.
    button.dataset.botiaAction = "request-barcode";
    button.dataset.returnUrl = returnUrl;

    // Generic event: a host integration may intercept this.
    window.dispatchEvent(new CustomEvent("botia:request-barcode", { detail }));

    // Optional native/app bridge. If present, it owns capture and return.
    if (window.BotiaBarcodeBridge &&
        typeof window.BotiaBarcodeBridge.requestBarcode === "function") {
      window.BotiaBarcodeBridge.requestBarcode(detail);
      return;
    }

    // Web fallback: capture the barcode in the browser and return here.
    location.href = detail.fallbackUrl;
  };

  const render = async () => {
    const anchor = document.querySelector(".more-links");
    if (!anchor) return;

    const labels = await loadLabels();
    injectStyle();

    const section = document.createElement("section");
    section.id = "botia-traceability-bridge";
    section.setAttribute("aria-labelledby", "botia-traceability-title");

    const title = document.createElement("div");
    title.className = "btb-kicker";
    title.id = "botia-traceability-title";
    title.textContent = labels.title;

    const copy = document.createElement("p");
    copy.className = "btb-copy";
    copy.textContent = gtin ? labels.with_gtin : labels.without_gtin;

    const meta = document.createElement("p");
    meta.className = "btb-meta";
    meta.textContent = gtin
      ? `${labels.barcode_present}: ${gtin}`
      : labels.barcode_missing;

    section.append(title, copy, meta);

    if (gtin) {
      const link = document.createElement("a");
      link.className = "btb-action";
      link.href = buildTraceabilityUrl();
      link.textContent = labels.open_traceability;
      section.appendChild(link);
    } else {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "btb-action";
      button.textContent = labels.add_barcode;
      button.addEventListener("click", () => requestBarcode(button));
      section.appendChild(button);
    }

    anchor.insertAdjacentElement("beforebegin", section);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", render, { once: true });
  } else {
    render();
  }
})();
