// BOTIA — Traceability renderer v2.
// Contract: /data/contracts/traceability-contract-v1.json
(() => {
  "use strict";

  const STATUS = new Set([
    "VERIFIED_PRODUCT",
    "VERIFIED_SCOPE",
    "REGULATORY_CONTEXT",
    "SELF_DECLARED",
    "SOURCE_CLASSIFICATION",
    "CONFLICT",
    "NOT_VERIFIED"
  ]);

  const DOMAINS = [
    "identity",
    "halal",
    "animal",
    "market",
    "packaging",
    "other"
  ];

  const DEFAULT_TEXT = {
    status: {
      VERIFIED_PRODUCT: "Verified for this product",
      VERIFIED_SCOPE: "Verified for a defined scope",
      REGULATORY_CONTEXT: "Regulatory context located",
      SELF_DECLARED: "Company declaration located",
      SOURCE_CLASSIFICATION: "Source classification located",
      CONFLICT: "Sources in conflict",
      NOT_VERIFIED: "Not verified in the sources consulted"
    },
    symbol: {
      VERIFIED_PRODUCT: "✓",
      VERIFIED_SCOPE: "◎",
      REGULATORY_CONTEXT: "R",
      SELF_DECLARED: "D",
      SOURCE_CLASSIFICATION: "S",
      CONFLICT: "↔",
      NOT_VERIFIED: "?"
    },
    domain: {
      identity: "Product identity",
      halal: "Halal traceability",
      animal: "Animal / cruelty-free traceability",
      market: "Market / registry context",
      packaging: "Packaging traceability",
      other: "Other verified information"
    },
    field_subject: "Subject",
    field_scope: "Scope",
    field_market: "Market",
    field_date: "Date",
    field_source: "Source",
    field_authority: "Authority",
    field_certificate: "Certificate / registration",
    field_validity: "Validity",
    open_source: "Open source →",
    scope_warning: "This evidence applies only to the scope shown. BOTIA does not automatically extend it to another product, brand, parent company, market or plant.",
    not_verified_note: "No negative conclusion is drawn from this result.",
    contract_error: "This item was not displayed as verified because required traceability fields were missing."
  };

  const params = new URLSearchParams(location.search);
  const lang = String(params.get("lang") || document.documentElement.lang || "en")
    .trim()
    .toLowerCase();

  let text = structuredClone ? structuredClone(DEFAULT_TEXT) : JSON.parse(JSON.stringify(DEFAULT_TEXT));

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

  const loadLabels = async () => {
    const fetchLang = async code => {
      const response = await fetch(`/i18n/${encodeURIComponent(code)}/traceability.json`, {
        cache: "no-store"
      });
      if (!response.ok) throw new Error(`traceability i18n ${response.status}`);
      return response.json();
    };

    try {
      const loaded = await fetchLang(lang);
      if (loaded.runtime) {
        text = {
          ...text,
          ...loaded.runtime,
          status: { ...text.status, ...(loaded.runtime.status || {}) },
          symbol: { ...text.symbol, ...(loaded.runtime.symbol || {}) },
          domain: { ...text.domain, ...(loaded.runtime.domain || {}) }
        };
      }
    } catch (_) {
      if (lang !== "en") {
        try {
          const loaded = await fetchLang("en");
          if (loaded.runtime) {
            text = {
              ...text,
              ...loaded.runtime,
              status: { ...text.status, ...(loaded.runtime.status || {}) },
              symbol: { ...text.symbol, ...(loaded.runtime.symbol || {}) },
              domain: { ...text.domain, ...(loaded.runtime.domain || {}) }
            };
          }
        } catch (_) {}
      }
    }
  };

  const sessionStoragePayload = () => {
    const id = params.get("session");
    if (!id) return null;
    try {
      return safeJson(sessionStorage.getItem(`botia.traceability.${id}`));
    } catch (_) {
      return null;
    }
  };

  const queryFallback = () => ({
    schema_version: "1.0",
    query: {
      gtin: params.get("gtin") || "",
      gtin14: params.get("gtin14") || "",
      market: params.get("market") || "",
      lang
    },
    product: {
      name: params.get("product") || "",
      brand: params.get("brand") || ""
    },
    overall_status: params.get("status") || "",
    records: [],
    consulted_sources: [],
    warnings: []
  });

  const getPayload = () => {
    if (window.BOTIA_TRACEABILITY_DATA && typeof window.BOTIA_TRACEABILITY_DATA === "object") {
      return window.BOTIA_TRACEABILITY_DATA;
    }
    return sessionStoragePayload() || safeJson(params.get("payload")) || queryFallback();
  };

  const clean = value => String(value ?? "").trim();

  const isHttpUrl = raw => {
    try {
      const url = new URL(raw, location.origin);
      return url.protocol === "https:" || url.protocol === "http:" ? url : null;
    } catch (_) {
      return null;
    }
  };

  const statusChip = status => {
    const code = STATUS.has(status) ? status : "NOT_VERIFIED";
    const chip = document.createElement("span");
    chip.className = "status-chip";
    chip.dataset.status = code;

    const symbol = document.createElement("span");
    symbol.className = "status-symbol";
    symbol.setAttribute("aria-hidden", "true");
    symbol.textContent = text.symbol[code] || "•";

    const label = document.createElement("span");
    label.textContent = text.status[code] || code;

    chip.append(symbol, label);
    return chip;
  };

  const subjectText = record => {
    const s = record.subject;
    if (typeof s === "string") return clean(s);
    if (!s || typeof s !== "object") return "";
    const parts = [s.name, s.identifier].map(clean).filter(Boolean);
    return parts.join(" · ");
  };

  const scopeText = record => {
    const s = record.scope;
    if (typeof s === "string") return clean(s);
    if (!s || typeof s !== "object") return "";
    const parts = [s.type, s.value].map(clean).filter(Boolean);
    return parts.join(": ");
  };

  const sourceName = record => {
    if (typeof record.source === "string") return clean(record.source);
    return clean(record.source?.name);
  };

  const sourceAuthority = record => clean(record.source?.authority);
  const sourceUrl = record => clean(record.source?.url);
  const dateText = record => clean(
    record.date ||
    record.source?.retrieved_at ||
    record.source?.published_at ||
    record.source?.valid_from
  );

  const certificateText = record => clean(
    record.evidence?.certificate_id ||
    record.evidence?.registration_id ||
    record.evidence?.record_id
  );

  const validityText = record => {
    const from = clean(record.source?.valid_from);
    const to = clean(record.source?.valid_to);
    if (from && to) return `${from} → ${to}`;
    return to || from;
  };

  const recordHasRequiredEvidence = record => {
    if (record.status === "NOT_VERIFIED") return true;
    return Boolean(
      subjectText(record) &&
      scopeText(record) &&
      sourceName(record) &&
      dateText(record)
    );
  };

  const addField = (dl, label, value) => {
    const v = clean(value);
    if (!v) return;
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = v;
    dl.append(dt, dd);
  };

  const renderRecord = record => {
    const article = document.createElement("article");
    article.className = "record";

    if (!recordHasRequiredEvidence(record)) {
      article.dataset.contractError = "true";
      const h = document.createElement("h2");
      h.textContent = clean(record.title) || text.status.NOT_VERIFIED;
      const p = document.createElement("p");
      p.textContent = text.contract_error;
      article.append(h, p);
      return article;
    }

    const head = document.createElement("div");
    head.className = "record-head";

    const h2 = document.createElement("h2");
    h2.textContent = clean(record.title) || text.domain[record.domain] || text.domain.other;
    head.appendChild(h2);
    head.appendChild(statusChip(record.status));
    article.appendChild(head);

    const summary = clean(record.summary || record.text);
    if (summary) {
      const p = document.createElement("p");
      p.textContent = summary;
      article.appendChild(p);
    }

    const dl = document.createElement("dl");
    addField(dl, text.field_subject, subjectText(record));
    addField(dl, text.field_scope, scopeText(record));
    addField(dl, text.field_market, record.market);
    addField(dl, text.field_date, dateText(record));
    addField(dl, text.field_source, sourceName(record));
    addField(dl, text.field_authority, sourceAuthority(record));
    addField(dl, text.field_certificate, certificateText(record));
    addField(dl, text.field_validity, validityText(record));
    if (dl.children.length) article.appendChild(dl);

    if (record.status === "VERIFIED_SCOPE") {
      const note = document.createElement("div");
      note.className = "scope-note";
      note.textContent = text.scope_warning;
      article.appendChild(note);
    } else if (record.status === "NOT_VERIFIED") {
      const note = document.createElement("div");
      note.className = "scope-note";
      note.textContent = text.not_verified_note;
      article.appendChild(note);
    }

    const url = isHttpUrl(sourceUrl(record));
    if (url) {
      const link = document.createElement("a");
      link.className = "source-link";
      link.href = url.toString();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = clean(record.source?.link_label) || text.open_source;
      article.appendChild(link);
    }

    return article;
  };

  const renderIdentity = data => {
    const gtin = clean(data.query?.gtin || data.gtin || params.get("gtin"));
    const gtin14 = clean(data.query?.gtin14 || data.gtin14 || params.get("gtin14"));
    const productName = clean(data.product?.name || data.product_name || params.get("product"));
    const brand = clean(data.product?.brand || params.get("brand"));
    const market = clean(data.query?.market || data.market || params.get("market"));

    el("gtin").textContent = gtin || "—";

    const show = (block, valueId, value) => {
      if (!value) return;
      el(block).hidden = false;
      el(valueId).textContent = value;
    };

    show("product_block", "product", productName);
    show("brand_block", "brand", brand);
    show("market_block", "market", market);
    show("gtin14_block", "gtin14", gtin14);

    const overall = clean(data.overall_status);
    if (STATUS.has(overall)) {
      el("overall_block").hidden = false;
      el("overall_status").replaceChildren(statusChip(overall));
    }
  };

  const renderRecords = data => {
    const records = Array.isArray(data.records)
      ? data.records.filter(r => r && typeof r === "object")
      : [];

    el("empty_state").hidden = records.length > 0;
    const root = el("records");
    root.replaceChildren();

    const grouped = new Map();
    for (const domain of DOMAINS) grouped.set(domain, []);

    records.forEach(record => {
      const domain = DOMAINS.includes(record.domain) ? record.domain : "other";
      const status = clean(record.status);
      record.status = STATUS.has(status) ? status : "NOT_VERIFIED";
      grouped.get(domain).push(record);
    });

    for (const domain of DOMAINS) {
      const group = grouped.get(domain);
      if (!group.length) continue;

      const heading = document.createElement("div");
      heading.className = "domain";
      heading.textContent = text.domain[domain] || text.domain.other;
      root.appendChild(heading);

      group.forEach(record => root.appendChild(renderRecord(record)));
    }
  };

  const renderConsulted = data => {
    const items = Array.isArray(data.consulted_sources) ? data.consulted_sources : [];
    if (!items.length) return;

    el("consulted_section").hidden = false;
    const box = el("consulted_sources");
    box.replaceChildren();

    items.forEach(item => {
      const name = typeof item === "string" ? item : clean(item?.name);
      if (!name) return;
      const pill = document.createElement("span");
      pill.className = "source-pill";
      const date = typeof item === "object" ? clean(item.retrieved_at || item.date) : "";
      pill.textContent = date ? `${name} · ${date}` : name;
      box.appendChild(pill);
    });
  };

  const renderWarnings = data => {
    const items = Array.isArray(data.warnings) ? data.warnings : [];
    if (!items.length) return;

    el("warnings_section").hidden = false;
    const box = el("warnings");
    box.replaceChildren();

    items.forEach(item => {
      const value = typeof item === "string" ? item : clean(item?.text);
      if (!value) return;
      const note = document.createElement("div");
      note.className = "warning";
      note.textContent = value;
      box.appendChild(note);
    });
  };

  const init = async () => {
    await loadLabels();
    const data = getPayload() || queryFallback();
    renderIdentity(data);
    renderRecords(data);
    renderConsulted(data);
    renderWarnings(data);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
