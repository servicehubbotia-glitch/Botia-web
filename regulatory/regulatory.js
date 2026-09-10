(() => {
  "use strict";

  const SUPPORTED_LANGS = ["en","es","ar","de","fr","nl","it","pt","pl","ro","ru","tr","zh","id"];
  const RTL = new Set(["ar"]);
  const $ = selector => document.querySelector(selector);

  let data = {};
  let records = [];
  let currentLang = "en";

  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[char]));

  function requestedLanguage() {
    const query = new URLSearchParams(location.search).get("lang");
    if (SUPPORTED_LANGS.includes(query)) return query;

    try {
      const stored = localStorage.getItem("botia-lang");
      if (SUPPORTED_LANGS.includes(stored)) return stored;
    } catch (_) {}

    const detected = (navigator.language || "en").split("-")[0].toLowerCase();
    return SUPPORTED_LANGS.includes(detected) ? detected : "en";
  }

  async function loadData(lang) {
    try {
      const response = await fetch(`/i18n/${lang}/regulatory.json`, { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return { payload: await response.json(), lang };
    } catch (error) {
      if (lang === "en") throw error;

      const response = await fetch("/i18n/en/regulatory.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`English fallback HTTP ${response.status}`);

      return { payload: await response.json(), lang: "en" };
    }
  }

  function applyUI() {
    Object.entries(data).forEach(([key, value]) => {
      if (key === "records" || key === "_meta" || typeof value !== "string") return;
      const el = document.getElementById(key);
      if (el) el.textContent = value;
    });

    if (data.page_title) document.title = data.page_title;
    if (data.description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", data.description);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", data.description);
    }

    if (data.reg_search_placeholder) {
      $("#search")?.setAttribute("placeholder", data.reg_search_placeholder);
    }
  }

  function withLang(url) {
    try {
      const parsed = new URL(url, location.origin);
      if (parsed.hostname === location.hostname || parsed.hostname === "www.botia-safefood.com") {
        parsed.searchParams.set("lang", currentLang);
      }
      return parsed.toString();
    } catch (_) {
      return url;
    }
  }

  function uniqueFrom(list, field) {
    return [...new Set(
      list
        .map(record => record[field])
        .filter(value => value !== null && value !== undefined && String(value).trim() !== "")
    )].sort((a,b) => String(a).localeCompare(String(b), currentLang));
  }

  function ingredientList() {
    const map = new Map();

    records.forEach(record => {
      if (!map.has(record.ingredient_slug)) {
        map.set(record.ingredient_slug, {
          slug: record.ingredient_slug,
          name: record.ingredient_name,
          code: record.e_code_or_INS || ""
        });
      }
    });

    return [...map.values()].sort((a,b) => a.name.localeCompare(b.name, currentLang));
  }

  function setOptions(select, items, allLabel, preserveValue = "") {
    if (!select) return;

    const current = preserveValue || select.value || "";

    select.innerHTML =
      `<option value="">${esc(allLabel)}</option>` +
      items.map(item => {
        const value = item.value ?? item;
        const label = item.label ?? item;
        return `<option value="${esc(value)}">${esc(label)}</option>`;
      }).join("");

    if ([...select.options].some(option => option.value === current)) {
      select.value = current;
    }
  }

  function badgeClass(value = "") {
    const text = String(value).toLowerCase();

    if (text.includes("prohibit")) return "badge-prohibited";
    if (text.includes("withdraw") || text.includes("not author")) return "badge-revoked";
    if (text.includes("warning") || text.includes("labell")) return "badge-warning";
    if (text.includes("restrict")) return "badge-restricted";
    if (
      text.includes("limit") ||
      text.includes("adi") ||
      text.includes("tdi") ||
      text.includes("ptwi") ||
      text.includes("ptmi")
    ) return "badge-limit";

    return "badge-other";
  }

  function statusClass(value = "") {
    const text = String(value).toLowerCase();

    if (text.includes("future") || text.includes("pending")) return "badge-future";
    if (text.includes("transition")) return "badge-transition";
    if (text.includes("review")) return "badge-review";

    return "badge-current";
  }

  function updateAuthorityOptions() {
    const jurisdiction = $("#filter-jurisdiction")?.value || "";
    const currentAuthority = $("#filter-authority")?.value || "";

    const source = jurisdiction
      ? records.filter(record => record.jurisdiction_or_scope === jurisdiction)
      : records;

    const authorities = uniqueFrom(source, "authority").map(value => ({
      value,
      label: value
    }));

    setOptions(
      $("#filter-authority"),
      authorities,
      data.reg_all || "All",
      currentAuthority
    );
  }

  function filteredRecords() {
    const query = ($("#search")?.value || "")
      .trim()
      .toLocaleLowerCase(currentLang);

    const filters = {
      ingredient_slug: $("#filter-substance")?.value || "",
      jurisdiction_or_scope: $("#filter-jurisdiction")?.value || "",
      authority: $("#filter-authority")?.value || "",
      measure_type: $("#filter-category")?.value || "",
      measure_status: $("#filter-temporal")?.value || ""
    };

    return records.filter(record => {
      const matchesFilters = Object.entries(filters).every(([field, value]) =>
        !value || String(record[field] ?? "") === value
      );

      if (!matchesFilters) return false;
      if (!query) return true;

      const haystack = [
        record.ingredient_name,
        record.ingredient_slug,
        record.e_code_or_INS,
        record.jurisdiction_or_scope,
        record.authority,
        record.measure_type,
        record.measure_status,
        record.scope,
        record.exact_measure,
        record.official_source_title
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(currentLang);

      return haystack.includes(query);
    });
  }

  function renderRegistry() {
    const filtered = filteredRecords();

    $("#empty-state").hidden = filtered.length !== 0;

    $("#registry-body").innerHTML = filtered.map(record => `
      <tr tabindex="0" data-id="${esc(record.record_id)}">

        <td>
          <a
            class="ingredient-link"
            href="${esc(withLang(record.BOTIA_URL))}"
          >
            ${esc(record.ingredient_name)}
          </a>

          ${record.e_code_or_INS
            ? `<small>${esc(record.e_code_or_INS)}</small>`
            : ""}
        </td>

        <td>
          <strong>${esc(record.jurisdiction_or_scope)}</strong>
          <small>${esc(record.authority)}</small>
        </td>

        <td>
          <span class="badge ${badgeClass(record.measure_type)}">
            ${esc(record.measure_type)}
          </span>
          ${record.scope ? `<small>${esc(record.scope)}</small>` : ""}
        </td>

        <td>
          <span class="badge ${statusClass(record.measure_status)}">
            ${esc(record.measure_status)}
          </span>
        </td>

        <td>
          ${esc(record.date || data.reg_not_available || "Not specified")}
        </td>

        <td>
          <a
            class="reg-source-link"
            href="${esc(record.official_source_URL)}"
            target="_blank"
            rel="noopener"
          >
            ${esc(record.official_source_title || data.reg_open_source || "Official source")}
          </a>
        </td>

      </tr>
    `).join("");
  }

  function openDetail(record) {
    if (!record) return;

    $("#detail-title").textContent =
      `${record.ingredient_name}${record.e_code_or_INS ? ` · ${record.e_code_or_INS}` : ""}`;

    $("#detail-content").innerHTML = `
      <div class="reg-detail-grid">

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_table_jurisdiction || "Jurisdiction / scope")}</span>
          <p><strong>${esc(record.jurisdiction_or_scope)}</strong></p>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_authority || "Authority")}</span>
          <p><strong>${esc(record.authority)}</strong></p>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_table_measure || "Measure")}</span>
          <span class="badge ${badgeClass(record.measure_type)}">${esc(record.measure_type)}</span>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_table_status || "Status")}</span>
          <span class="badge ${statusClass(record.measure_status)}">${esc(record.measure_status)}</span>
        </div>

        <div class="reg-detail-block wide">
          <span class="reg-detail-label">${esc(data.reg_scope || "Scope")}</span>
          <p>${esc(record.scope || data.reg_not_available || "Not specified")}</p>
        </div>

        <div class="reg-detail-block wide">
          <span class="reg-detail-label">${esc(data.reg_exact_measure || "Documented measure")}</span>
          <p>${esc(record.exact_measure)}</p>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_table_date || "Date")}</span>
          <p>${esc(record.date || data.reg_not_available || "Not specified")}</p>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_verification || "Verification")}</span>
          <span class="reg-verification">${esc(record.verification_status)}</span>
        </div>

      </div>

      <div class="reg-dialog-actions">

        <a
          class="reg-action"
          href="${esc(record.official_source_URL)}"
          target="_blank"
          rel="noopener"
        >
          ${esc(data.reg_open_source || "Official source ↗")}
        </a>

        <a
          class="reg-action"
          href="${esc(withLang(record.BOTIA_URL))}"
        >
          ${esc(data.reg_open_ingredient || "BOTIA ingredient ↗")}
        </a>

      </div>
    `;

    $("#detail-dialog").showModal();
  }

  function clearFilters() {
    $("#search").value = "";

    [
      "#filter-substance",
      "#filter-jurisdiction",
      "#filter-authority",
      "#filter-category",
      "#filter-temporal"
    ].forEach(selector => {
      const element = $(selector);
      if (element) element.value = "";
    });

    updateAuthorityOptions();
    renderRegistry();
  }

  function bindEvents() {
    $("#search")?.addEventListener("input", renderRegistry);

    $("#filter-substance")?.addEventListener("change", renderRegistry);

    $("#filter-jurisdiction")?.addEventListener("change", () => {
      updateAuthorityOptions();
      renderRegistry();
    });

    $("#filter-authority")?.addEventListener("change", renderRegistry);
    $("#filter-category")?.addEventListener("change", renderRegistry);
    $("#filter-temporal")?.addEventListener("change", renderRegistry);

    $("#clear-filters")?.addEventListener("click", clearFilters);

    $("#close-dialog")?.addEventListener("click", () => {
      $("#detail-dialog").close();
    });

    $("#detail-dialog")?.addEventListener("click", event => {
      if (event.target === $("#detail-dialog")) {
        $("#detail-dialog").close();
      }
    });

    $("#registry-body")?.addEventListener("click", event => {
      if (event.target.closest("a")) return;

      const row = event.target.closest("tr[data-id]");
      if (!row) return;

      openDetail(
        records.find(record => record.record_id === row.dataset.id)
      );
    });

    $("#registry-body")?.addEventListener("keydown", event => {
      if (event.key !== "Enter" && event.key !== " ") return;
      if (event.target.closest("a")) return;

      const row = event.target.closest("tr[data-id]");
      if (!row) return;

      event.preventDefault();

      openDetail(
        records.find(record => record.record_id === row.dataset.id)
      );
    });
  }

  function initControls() {
    const ingredientOptions = ingredientList().map(item => ({
      value: item.slug,
      label: `${item.name}${item.code ? ` · ${item.code}` : ""}`
    }));

    setOptions(
      $("#filter-substance"),
      ingredientOptions,
      data.reg_all || "All"
    );

    setOptions(
      $("#filter-jurisdiction"),
      uniqueFrom(records, "jurisdiction_or_scope").map(value => ({
        value,
        label: value
      })),
      data.reg_all || "All"
    );

    setOptions(
      $("#filter-category"),
      uniqueFrom(records, "measure_type").map(value => ({
        value,
        label: value
      })),
      data.reg_all || "All"
    );

    setOptions(
      $("#filter-temporal"),
      uniqueFrom(records, "measure_status").map(value => ({
        value,
        label: value
      })),
      data.reg_all || "All"
    );

    updateAuthorityOptions();

    const params = new URLSearchParams(location.search);
    const ingredient = params.get("ingredient");

    if (
      ingredient &&
      ingredientOptions.some(option => option.value === ingredient)
    ) {
      $("#filter-substance").value = ingredient;
    }
  }

  async function init() {
    currentLang = requestedLanguage();

    const loaded = await loadData(currentLang);

    data = loaded.payload;
    currentLang = loaded.lang;
    records = Array.isArray(data.records) ? data.records : [];

    document.documentElement.lang = currentLang;
    document.documentElement.dir = RTL.has(currentLang) ? "rtl" : "ltr";
    document.body.dir = RTL.has(currentLang) ? "rtl" : "ltr";

    const select = $("#lang-select");
    if (select) select.value = currentLang;

    applyUI();
    initControls();
    bindEvents();
    renderRegistry();
  }

  init().catch(error => {
    console.error("BOTIA Regulatory could not load:", error);

    const body = $("#registry-body");
    if (body) {
      body.innerHTML = `
        <tr>
          <td colspan="6">
            Could not load regulatory data.
          </td>
        </tr>
      `;
    }
  });
})();
