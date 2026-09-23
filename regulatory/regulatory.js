(() => {
  "use strict";

  const SUPPORTED_LANGS = ["en","es","ar","de","fr","nl","it","pt","pl","ro","ru","tr","zh","id"];
  const RTL = new Set(["ar"]);
  const $ = selector => document.querySelector(selector);

  let data = {};
  let records = [];
  let currentLang = "en";

  // Los filtros agrupan por el valor inglés del registro, no por su
  // traducción: el mismo organismo puede estar traducido de varias formas
  // y en ese caso el filtro mostraría solo una parte de sus registros.
  let canonicalByRecordId = null;


  const NUTRITION_PROFILE_SLUGS = new Set([
    "protein",
    "carbohydrate",
    "starch",
    "polyols",
    "salt",
    "sodium",
    "energy",
    "total_fat",
    "monounsaturated_fat",
    "polyunsaturated_fat",
    "cholesterol",
    "fibre",
    "total_sugars",
    "saturated_fat",
    "added_sugars"
  ]);

  const FILTER_FIELDS = [
    "jurisdiction_or_scope",
    "authority",
    "measure_type",
    "measure_status"
  ];

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

  async function loadCanonical() {
    if (canonicalByRecordId) return;

    try {
      const response = await fetch("/i18n/en/regulatory.json", {
        cache: "no-store"
      });

      if (!response.ok) throw new Error(response.status);

      const master = await response.json();
      const englishRecords = Array.isArray(master)
        ? master
        : (master.records || []);

      canonicalByRecordId = new Map();

      englishRecords.forEach(record => {
        if (!record.record_id) return;

        const values = {};

        FILTER_FIELDS.forEach(field => {
          values[field] = String(record[field] ?? "").trim();
        });

        canonicalByRecordId.set(record.record_id, values);
      });
    } catch (error) {
      // Si el inglés no se puede cargar, se mantiene el comportamiento
      // anterior: agrupar por el texto traducido. Peor, pero funciona.
      console.warn("BOTIA regulatory: sin referencia inglesa", error);
      canonicalByRecordId = new Map();
    }
  }

  // Valor canónico de un campo. Si no hay referencia inglesa para ese
  // registro, se usa su propia traducción, que es lo que se hacía antes.
  function canonicalValue(record, field) {
    const canonical = canonicalByRecordId?.get(record.record_id);
    const value = canonical?.[field];

    if (value) return value;

    return String(record[field] ?? "").trim();
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

  // Devuelve [{ value, label }]:
  //   value → clave inglesa, que es con lo que se filtra
  //   label → texto traducido que ve la persona
  function uniqueFrom(list, field) {
    const groups = new Map();

    list.forEach(record => {
      const key = canonicalValue(record, field);
      if (!key) return;

      const label = String(record[field] ?? "").trim() || key;

      if (!groups.has(key)) {
        groups.set(key, new Map());
      }

      const labels = groups.get(key);
      labels.set(label, (labels.get(label) || 0) + 1);
    });

    const options = [];

    groups.forEach((labels, key) => {
      // Si el mismo valor tiene varias traducciones, se muestra la más
      // frecuente. El filtro sigue agrupándolas todas.
      let best = "";
      let bestCount = -1;

      labels.forEach((count, label) => {
        if (count > bestCount) {
          best = label;
          bestCount = count;
        }
      });

      options.push({
        value: key,
        label: best
      });
    });

    return options.sort((a, b) =>
      String(a.label).localeCompare(
        String(b.label),
        currentLang
      )
    );
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

  function englishMeasureType(record) {
    return canonicalValue(record, "measure_type");
  }

  function englishMeasureStatus(record) {
    return canonicalValue(record, "measure_status");
  }

  function badgeClass(record) {
    const text = String(englishMeasureType(record)).toLowerCase();

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

  function statusClass(record) {
    const text = String(englishMeasureStatus(record)).toLowerCase();

    if (text.includes("future") || text.includes("pending")) return "badge-future";
    if (text.includes("transition") || text.includes("phased")) return "badge-transition";
    if (text.includes("review")) return "badge-review";

    return "badge-current";
  }

  function updateAuthorityOptions() {
    const jurisdiction = $("#filter-jurisdiction")?.value || "";
    const currentAuthority = $("#filter-authority")?.value || "";

    const source = jurisdiction
      ? records.filter(
          record =>
            canonicalValue(
              record,
              "jurisdiction_or_scope"
            ) === jurisdiction
        )
      : records;

    const authorities = uniqueFrom(
      source,
      "authority"
    );

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
      const matchesFilters = Object.entries(filters).every(([field, value]) => {
        if (!value) return true;

        // ingredient_slug ya es una clave estable: no se traduce.
        if (field === "ingredient_slug") {
          return String(record[field] ?? "") === value;
        }

        return canonicalValue(record, field) === value;
      });

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
          <span class="badge ${badgeClass(record)}">
            ${esc(record.measure_type)}
          </span>
          ${record.scope ? `<small>${esc(record.scope)}</small>` : ""}
        </td>

        <td>
          <span class="badge ${statusClass(record)}">
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
          <span class="badge ${badgeClass(record)}">${esc(record.measure_type)}</span>
        </div>

        <div class="reg-detail-block">
          <span class="reg-detail-label">${esc(data.reg_table_status || "Status")}</span>
          <span class="badge ${statusClass(record)}">${esc(record.measure_status)}</span>
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


  function requestedNutritionProfile() {
    const params =
      new URLSearchParams(location.search);

    const slug =
      String(
        params.get("ingredient") || ""
      ).trim();

    if (
      params.get("nutrition") !== "1" ||
      !NUTRITION_PROFILE_SLUGS.has(slug)
    ) {
      return "";
    }

    return slug;
  }

  async function loadNutritionProfile(
    slug,
    lang
  ) {
    const load = async requested => {
      const response = await fetch(
        `/i18n/${requested}/${encodeURIComponent(slug)}.json`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error(
          `Nutrition profile ${response.status}`
        );
      }

      return response.json();
    };

    try {
      return await load(lang);
    } catch (error) {
      if (lang === "en") throw error;
      return load("en");
    }
  }

  async function renderNutritionSourcesIfRequested() {
    const slug =
      requestedNutritionProfile();

    if (!slug) return false;

    // Si en el futuro este nutriente obtiene filas
    // estructuradas, usamos automáticamente el registro normal.
    const hasStructuredRecords =
      records.some(
        record =>
          String(record.ingredient_slug || "") === slug
      );

    if (hasStructuredRecords) {
      return false;
    }

    const profile =
      await loadNutritionProfile(
        slug,
        currentLang
      );

    const sources =
      Array.isArray(profile.sources)
        ? profile.sources.filter(source => {
            const url =
              String(source?.url || "").trim();

            return /^https?:\/\//i.test(url);
          })
        : [];

    if (!sources.length) {
      return false;
    }

    const registry =
      $("#registry");

    if (!registry) return false;

    const filters =
      registry.querySelector(".reg-filters");

    const tableWrap =
      registry.querySelector(".table-wrap");

    if (filters) {
      filters.hidden = true;
    }

    if (tableWrap) {
      tableWrap.hidden = true;
    }

    document
      .getElementById("nutrition-regulatory-panel")
      ?.remove();

    const panel =
      document.createElement("div");

    panel.id =
      "nutrition-regulatory-panel";

    panel.className =
      "page-section";

    panel.style.marginTop =
      "24px";

    const eyebrow =
      document.createElement("p");

    eyebrow.className =
      "reg-eyebrow";

    eyebrow.textContent =
      data.reg_nutrition_sources_eyebrow
      || "Nutrition in Regulatory";

    const title =
      document.createElement("h2");

    title.textContent =
      profile.name
      || profile.title
      || slug;

    const intro =
      document.createElement("p");

    intro.textContent =
      data.reg_nutrition_sources_intro
      || (
        "This nutrition profile does not yet have " +
        "structured measure rows in the Regulatory " +
        "register. BOTIA shows the official regulatory " +
        "and reference sources linked to the profile instead."
      );

    const grid =
      document.createElement("div");

    grid.className =
      "reg-method-grid";

    sources.forEach(source => {
      const article =
        document.createElement("article");

      article.className =
        "page-section";

      const link =
        document.createElement("a");

      link.className =
        "reg-source-link";

      link.href =
        String(source.url);

      link.target =
        "_blank";

      link.rel =
        "noopener noreferrer";

      link.textContent =
        String(
          source.label
          || data.reg_open_source
          || "Official source"
        );

      article.appendChild(link);
      grid.appendChild(article);
    });

    const actions =
      document.createElement("div");

    actions.className =
      "reg-dialog-actions";

    const profileLink =
      document.createElement("a");

    profileLink.className =
      "reg-action";

    profileLink.href =
      withLang(
        `/ingredients/${slug}.html`
      );

    profileLink.textContent =
      data.reg_nutrition_profile_link
      || "Open Nutrition profile ↗";

    actions.appendChild(
      profileLink
    );

    panel.append(
      eyebrow,
      title,
      intro,
      grid,
      actions
    );

    if (tableWrap) {
      tableWrap.insertAdjacentElement(
        "beforebegin",
        panel
      );
    } else {
      registry.appendChild(panel);
    }

    return true;
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
      uniqueFrom(records, "jurisdiction_or_scope"),
      data.reg_all || "All"
    );

    setOptions(
      $("#filter-category"),
      uniqueFrom(records, "measure_type"),
      data.reg_all || "All"
    );

    setOptions(
      $("#filter-temporal"),
      uniqueFrom(records, "measure_status"),
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

    // Los filtros y las categorías visuales usan el valor inglés
    // asociado por record_id como clave estable.
    await loadCanonical();

    document.documentElement.lang = currentLang;
    document.documentElement.dir = RTL.has(currentLang) ? "rtl" : "ltr";
    document.body.dir = RTL.has(currentLang) ? "rtl" : "ltr";

    const select = $("#lang-select");
    if (select) select.value = currentLang;

    applyUI();
    initControls();
    bindEvents();

    const nutritionFallbackRendered =
      await renderNutritionSourcesIfRequested();

    if (!nutritionFallbackRendered) {
      renderRegistry();
    }
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
