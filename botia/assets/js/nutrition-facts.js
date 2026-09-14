// BOTIA — Nutrition Facts renderer v2.
// Accepts query payloads and Flutter/WebView runtime injection.
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const el = id => document.getElementById(id);

  const safeJson = raw => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) {}
    try {
      let b64 = String(raw).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) {
      return null;
    }
  };

  const unwrap = raw => {
    if (!raw || typeof raw !== "object") return null;
    if (raw.web_payload && typeof raw.web_payload === "object") {
      return raw.web_payload;
    }
    if (raw.nutrition?.web_payload &&
        typeof raw.nutrition.web_payload === "object") {
      return raw.nutrition.web_payload;
    }
    if ("declared" in raw || "references" in raw || "basis" in raw) {
      return raw;
    }
    return null;
  };

  const initialPayload = () => {
    const runtime = unwrap(window.BOTIA_NUTRITION_DATA);
    if (runtime) return runtime;
    return unwrap(safeJson(params.get("payload"))) || {
      basis: "",
      declared: [],
      references: []
    };
  };

  const clear = () => {
    el("basis").textContent = "—";
    el("declared_rows").replaceChildren();
    el("references").replaceChildren();
    el("declared_card").hidden = false;
    el("declared_empty").hidden = true;
    el("references_empty").hidden = false;
  };

  const displayAmount = row => {
    const value = row?.value;
    const unit = row?.unit;
    const parts = [];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      parts.push(String(value));
    }
    if (unit !== undefined && unit !== null && String(unit).trim() !== "") {
      parts.push(String(unit));
    }
    return parts.join(" ") || "—";
  };

  const renderDeclared = data => {
    const vals = Array.isArray(data.declared) ? data.declared : [];
    el("declared_empty").hidden = vals.length > 0;
    el("declared_card").hidden = vals.length === 0;

    for (const item of vals) {
      if (!item || typeof item !== "object") continue;

      const row = document.createElement("div");
      row.className = "nutrition-row" + (item.sub ? " sub" : "");

      const nutrient = document.createElement("div");
      nutrient.className = "nutrient";
      nutrient.textContent = item.label || item.key || "";

      const amount = document.createElement("div");
      amount.className = "amount";
      amount.textContent = displayAmount(item);

      row.append(nutrient, amount);
      el("declared_rows").appendChild(row);
    }
  };

  const validHttpUrl = raw => {
    try {
      const url = new URL(raw, location.origin);
      return /^https?:$/.test(url.protocol) ? url : null;
    } catch (_) {
      return null;
    }
  };

  const renderReferences = data => {
    const refs = Array.isArray(data.references) ? data.references : [];
    el("references_empty").hidden = refs.length > 0;

    for (const item of refs) {
      if (!item || typeof item !== "object") continue;

      const card = document.createElement("article");
      card.className = "ref-card";

      const head = document.createElement("div");
      head.className = "ref-head";

      const name = document.createElement("h3");
      name.className = "ref-name";
      name.textContent = item.label || item.nutrient || "Reference";
      head.appendChild(name);

      if (item.classification) {
        const tag = document.createElement("span");
        tag.className = "class-tag";
        tag.textContent = `Class ${item.classification}`;
        head.appendChild(tag);
      }
      card.appendChild(head);

      if (item.declared) {
        const p = document.createElement("p");
        p.className = "declared";
        p.textContent = item.declared;
        card.appendChild(p);
      }

      const cls = String(item.classification || "").toUpperCase();
      const percent = Number(item.percent);
      const showBar =
        (cls === "A" || cls === "B") &&
        Number.isFinite(percent) &&
        item.show_bar !== false;

      if (showBar) {
        const wrap = document.createElement("div");
        wrap.className = "bar-wrap";

        const track = document.createElement("div");
        track.className = "track";

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        track.appendChild(bar);

        const meta = document.createElement("div");
        meta.className = "bar-meta";

        const label = document.createElement("span");
        label.textContent = item.bar_label || "";

        const pct = document.createElement("span");
        pct.className = "percent";
        pct.textContent = `${percent}%`;

        meta.append(label, pct);
        wrap.append(track, meta);
        card.appendChild(wrap);
      }

      if (item.reference) {
        const p = document.createElement("p");
        p.className = "reference";
        p.textContent = item.reference;
        card.appendChild(p);
      }

      if (item.equivalent) {
        const p = document.createElement("p");
        p.className = "equivalent";
        p.textContent = item.equivalent;
        card.appendChild(p);
      }

      const url = validHttpUrl(item.url);
      if (url) {
        const link = document.createElement("a");
        link.className = "source";
        link.href = url.toString();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.source || "Official source →";
        card.appendChild(link);
      }

      el("references").appendChild(card);
    }
  };

  const render = raw => {
    const data = unwrap(raw) || { basis: "", declared: [], references: [] };
    clear();
    el("basis").textContent = data.basis || "—";
    renderDeclared(data);
    renderReferences(data);
  };

  const runtimePayload = event => {
    const eventData = unwrap(event?.detail);
    if (eventData) return eventData;
    return unwrap(window.BOTIA_NUTRITION_DATA);
  };

  const onRuntimeData = event => {
    const data = runtimePayload(event);
    if (data) render(data);
  };

  // Flutter/WebView runtime contract.
  document.addEventListener("botia:nutrition-ready", onRuntimeData);
  document.addEventListener("botia:nutrition-updated", onRuntimeData);

  const init = () => render(initialPayload());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
