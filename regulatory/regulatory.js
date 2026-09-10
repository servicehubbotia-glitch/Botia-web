(() => {
  "use strict";

  const SUPPORTED_LANGS = ["en","es","ar","de","fr","nl","it","pt","pl","ro","ru","tr","zh","id"];
  const RTL = new Set(["ar"]);
  const $ = (s) => document.querySelector(s);

  const esc = (v = "") => String(v ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#039;"
  }[c]));

  let data = null;
  let records = [];
  let currentLang = "en";

  function requestedLanguage() {
    const q = new URLSearchParams(location.search).get("lang");
    if (SUPPORTED_LANGS.includes(q)) return q;

    try {
      const saved = localStorage.getItem("botia-lang");
      if (SUPPORTED_LANGS.includes(saved)) return saved;
    } catch (_) {}

    const nav = (navigator.language || "en").split("-")[0].toLowerCase();
    return SUPPORTED_LANGS.includes(nav) ? nav : "en";
  }

  async function fetchData(lang) {
    try {
      const r = await fetch(`/i18n/${encodeURIComponent(lang)}/regulatory.json`, {
        cache: "no-store"
      });

      if (!r.ok) throw new Error(`HTTP ${r.status}`);

      return {
        payload: await r.json(),
        loadedLang: lang
      };
    } catch (err) {
      if (lang === "en") throw err;

      const r = await fetch("/i18n/en/regulatory.json", {
        cache: "no-store"
      });

      if (!r.ok) throw new Error(`English fallback HTTP ${r.status}`);

      return {
        payload: await r.json(),
        loadedLang: "en"
      };
    }
  }

  function applyText(payload) {
    Object.entries(payload).forEach(([key, value]) => {
      if (
        key === "records" ||
        key === "_meta" ||
        typeof value !== "string"
      ) return;

      const el = document.getElementById(key);
      if (el) el.textContent = value;
    });

    if (payload.page_title) {
      document.title = payload.page_title;
    }

    if (payload.description) {
      document
        .querySelector('meta[name="description"]')
        ?.setAttribute("content", payload.description);

      document
        .querySelector('meta[property="og:description"]')
        ?.setAttribute("content", payload.description);
    }

    if (payload.reg_search_placeholder) {
      $("#search")?.setAttribute(
        "placeholder",
        payload.reg_search_placeholder
      );
    }
  }

  function withLang(url) {
    try {
      const u = new URL(url, location.origin);

      if (
        u.origin === location.origin ||
        u.hostname === "www.botia-safefood.com"
      ) {
        u.searchParams.set("lang", currentLang);
      }

      return u.toString();
    } catch (_) {
      return url;
    }
  }

  function unique(field) {
    return [
      ...new Set(
        records
          .map(r => r[field])
          .filter(v =>
            v !== null &&
            v !== undefined &&
            String(v).trim() !== ""
          )
      )
    ].sort((a, b) =>
      String(a).localeCompare(String(b), currentLang)
    );
  }

  function ingredients() {
    const map = new Map();

    records.forEach(r => {
      if (!map.has(r.ingredient_slug)) {
        map.set(r.ingredient_slug, {
          slug: r.ingredient_slug,
          name: r.ingredient_name,
          code: r.e_code_or_INS || ""
        });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name, currentLang)
    );
  }

  function optionHTML(value, label) {
    return `<option value="${esc(value)}">${esc(label)}</option>`;
  }

  function fillSelect(el, values, allLabel, selected = "") {
    if (!el) return;

    el.innerHTML =
      optionHTML("", allLabel) +
      values
        .map(v => optionHTML(v.value ?? v, v.label ?? v))
        .join("");

    el.value = selected;
  }

  function measureBadgeClass(value = "") {
    const s = String(value).toLowerCase();

    if (s.includes("prohibit")) return "badge-prohibited";
    if (s.includes("withdraw") || s.includes("not author")) return "badge-revoked";
    if (s.includes("warning") || s.includes("labell")) return "badge-warning";
    if (s.includes("restrict")) return "badge-restricted";
    if (
      s.includes("limit") ||
      s.includes("adi") ||
      s.includes("tdi") ||
      s.includes("ptwi") ||
      s.includes("ptmi")
    ) return "badge-limit";

    return "badge-other";
  }

  function statusBadgeClass(value = "") {
    const s = String(value).toLowerCase();

    if (s.includes("future") || s.includes("pending")) return "badge-future";
    if (s.includes("transition")) return "badge-transition";
    if (s.includes("review")) return "badge-review";

    return "badge-current";
  }

  function compactCard(r) {
    return `
      <article class="record-compact">
        <span class="badge ${measureBadgeClass(r.measure_type)}">
          ${esc(r.measure_type)}
        </span>

        <p>${esc(r.exact_measure)}</p>

        <div class="side-title">
          <span>${esc(r.measure_status)}</span>
          <span>${esc(r.date || data.reg_not_available)}</span>
        </div>

        <a
          class="compact-link"
          href="${esc(r.official_source_URL)}"
          target="_blank"
          rel="noopener"
        >
          ${esc(data.reg_open_source)}
        </a>
      </article>
    `;
  }

  function renderComparison() {
    const a = $("#jurisdiction-a")?.value || "";
    const b = $("#jurisdiction-b")?.value || "";
    const slug = $("#compare-substance")?.value || "";
    const differencesOnly = $("#differences-only")?.checked ?? true;

    if (!a || !b) {
      $("#comparison-grid").innerHTML = "";
      $("#compare-summary").textContent = "";
      return;
    }

    const list = slug
      ? ingredients().filter(i => i.slug === slug)
      : ingredients();

    const rows = list
      .map(item => {
        const sideA = records.filter(r =>
          r.ingredient_slug === item.slug &&
          r.jurisdiction_or_scope === a
        );

        const sideB = records.filter(r =>
          r.ingredient_slug === item.slug &&
          r.jurisdiction_or_scope === b
        );

        const sigA = sideA
          .map(r =>
            `${r.measure_type}|${r.measure_status}|${r.exact_measure}`
          )
          .sort()
          .join(";");

        const sigB = sideB
          .map(r =>
            `${r.measure_type}|${r.measure_status}|${r.exact_measure}`
          )
          .sort()
          .join(";");

        return {
          item,
          sideA,
          sideB,
          differs: sigA !== sigB
        };
      })
      .filter(row => !differencesOnly || row.differs);

    const unknown = () => `
      <p class="unknown-card">
        <strong>${esc(data.reg_not_documented)}</strong>
        ${esc(data.reg_not_documented_note)}
      </p>
    `;

    $("#comparison-grid").innerHTML = rows.map(row => `
      <article class="comparison-card">

        <div class="substance-cell">
          <small>${esc(row.item.code)}</small>

          <a
            class="ingredient-link"
            href="${esc(withLang(
              records.find(r =>
                r.ingredient_slug === row.item.slug
              )?.BOTIA_URL || "#"
            ))}"
          >
            ${esc(row.item.name)}
          </a>
        </div>

        <div class="comparison-side">
          <div class="side-title">
            <span>${esc(a)}</span>
            <span>
              ${row.sideA.length}
              ${esc(
                row.sideA.length === 1
                  ? data.reg_record_word
                  : data.reg_records_word
              )}
            </span>
          </div>

          ${
            row.sideA.length
              ? row.sideA.map(compactCard).join("")
              : unknown()
          }
        </div>

        <div class="comparison-side">
          <div class="side-title">
            <span>${esc(b)}</span>
            <span>
              ${row.sideB.length}
              ${esc(
                row.sideB.length === 1
                  ? data.reg_record_word
                  : data.reg_records_word
              )}
            </span>
          </div>

          ${
            row.sideB.length
              ? row.sideB.map(compactCard).join("")
              : unknown()
          }
        </div>

      </article>
    `).join("");

    $("#compare-summary").innerHTML = `
      <span class="summary-dot" aria-hidden="true"></span>
      <span>
        <strong>${rows.length}</strong>
        · ${esc(data.reg_compare_summary)}
        · ${esc(a)} / ${esc(b)}
      </span>
    `;

    if (!rows.length) {
      $("#comparison-grid").innerHTML = `
        <div class="empty-state">
          <strong>${esc(data.reg_no_results)}</strong>
          <span>${esc(data.reg_no_results_note)}</span>
        </div>
      `;
    }
  }

  function filteredRecords() {
    const q = ($("#search")?.value || "")
      .trim()
      .toLocaleLowerCase(currentLang);

    const filters = {
      jurisdiction_or_scope:
        $("#filter-jurisdiction")?.value || "",

      ingredient_slug:
        $("#filter-substance")?.value || "",

      authority:
        $("#filter-authority")?.value || "",

      measure_type:
        $("#filter-category")?.value || "",

      measure_status:
        $("#filter-temporal")?.value || ""
    };

    return records.filter(r => {
      const matchFilters = Object.entries(filters).every(
        ([k, v]) =>
          !v || String(r[k] ?? "") === v
      );

      if (!matchFilters) return false;

      if (!q) return true;

      const haystack = Object.values(r)
        .filter(v => v !== null && v !== undefined)
        .join(" ")
        .toLocaleLowerCase(currentLang);

      return haystack.includes(q);
    });
  }

  function renderRegistry() {
    const filtered = filteredRecords();

    $("#result-count").textContent =
      `${filtered.length} / ${records.length} ${data.reg_records_word}`;

    $("#empty-state").hidden = filtered.length !== 0;

    $("#registry-body").innerHTML = filtered.map(r => `
      <tr tabindex="0" data-id="${esc(r.record_id)}">

        <td>
          <a
            class="ingredient-link"
            href="${esc(withLang(r.BOTIA_URL))}"
          >
            ${esc(r.ingredient_name)}
          </a>

          ${
            r.e_code_or_INS
              ? `<small>${esc(r.e_code_or_INS)}</small>`
              : ""
          }
        </td>

        <td>
          <strong>${esc(r.jurisdiction_or_scope)}</strong>
          <small>${esc(r.authority)}</small>
        </td>

        <td>
          <span class="badge ${measureBadgeClass(r.measure_type)}">
            ${esc(r.measure_type)}
          </span>
          <small>${esc(r.scope)}</small>
        </td>

        <td>
          <span class="badge ${statusBadgeClass(r.measure_status)}">
            ${esc(r.measure_status)}
          </span>
        </td>

        <td>${esc(r.date || data.reg_not_available)}</td>

        <td>
          <a
            href="${esc(r.official_source_URL)}"
            target="_blank"
            rel="noopener"
          >
            ${esc(
              r.official_source_title ||
              data.reg_open_source
            )}
          </a>
        </td>

      </tr>
    `).join("");
  }

  function openDetail(record) {
    if (!record) return;

    $("#detail-title").textContent =
      `${record.ingredient_name}${
        record.e_code_or_INS
          ? ` · ${record.e_code_or_INS}`
          : ""
      }`;

    $("#detail-content").innerHTML = `
      <div class="detail-grid">

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_table_jurisdiction)}
          </span>
          <strong>
            ${esc(record.jurisdiction_or_scope)}
          </strong>
        </div>

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_authority)}
          </span>
          <strong>${esc(record.authority)}</strong>
        </div>

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_table_measure)}
          </span>
          <span class="badge ${measureBadgeClass(record.measure_type)}">
            ${esc(record.measure_type)}
          </span>
        </div>

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_table_status)}
          </span>
          <span class="badge ${statusBadgeClass(record.measure_status)}">
            ${esc(record.measure_status)}
          </span>
        </div>

        <div class="detail-block wide">
          <span class="detail-label">
            ${esc(data.reg_scope)}
          </span>
          <p>
            ${esc(record.scope || data.reg_not_available)}
          </p>
        </div>

        <div class="detail-block wide">
          <span class="detail-label">
            ${esc(data.reg_exact_measure)}
          </span>
          <p>${esc(record.exact_measure)}</p>
        </div>

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_table_date)}
          </span>
          <p>
            ${esc(record.date || data.reg_not_available)}
          </p>
        </div>

        <div class="detail-block">
          <span class="detail-label">
            ${esc(data.reg_verification)}
          </span>
          <span class="verification">
            ${esc(record.verification_status)}
          </span>
        </div>

        <div class="detail-block wide">
          <span class="detail-label">
            ${esc(data.reg_traceability)}
          </span>
          <p>
            ${esc(
              record.source_in_BOTIA_materials ||
              data.reg_not_available
            )}
          </p>
        </div>

        ${
          record.notes
            ? `
              <div class="detail-block wide">
                <span class="detail-label">
                  ${esc(data.reg_notes)}
                </span>
                <p>${esc(record.notes)}</p>
              </div>
            `
            : ""
        }

      </div>

      <div class="dialog-actions">

        <a
          class="secondary-button"
          href="${esc(record.official_source_URL)}"
          target="_blank"
          rel="noopener"
        >
          ${esc(data.reg_open_source)}
        </a>

        <a
          class="secondary-button"
          href="${esc(withLang(record.BOTIA_URL))}"
        >
          ${esc(data.reg_open_ingredient)}
        </a>

      </div>
    `;

    $("#detail-dialog").showModal();
  }

  function exportCSV() {
    const rows = filteredRecords();

    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map(r =>
        headers.map(h => {
          const value = String(r[h] ?? "")
            .replace(/"/g, '""');

          return `"${value}"`;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob(
      [csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `BOTIA-regulatory-${currentLang}.csv`;
    a.click();

    URL.revokeObjectURL(url);
  }

  function bindEvents() {
    [
      "#jurisdiction-a",
      "#jurisdiction-b",
      "#compare-substance",
      "#differences-only"
    ].forEach(sel =>
      $(sel)?.addEventListener(
        "change",
        renderComparison
      )
    );

    $("#swap-jurisdictions")
      ?.addEventListener("click", () => {
        const a = $("#jurisdiction-a");
        const b = $("#jurisdiction-b");

        const tmp = a.value;
        a.value = b.value;
        b.value = tmp;

        renderComparison();
      });

    [
      "#filter-jurisdiction",
      "#filter-substance",
      "#filter-authority",
      "#filter-category",
      "#filter-temporal"
    ].forEach(sel =>
      $(sel)?.addEventListener(
        "change",
        renderRegistry
      )
    );

    $("#search")
      ?.addEventListener(
        "input",
        renderRegistry
      );

    $("#clear-filters")
      ?.addEventListener("click", () => {
        $("#search").value = "";

        [
          "#filter-jurisdiction",
          "#filter-substance",
          "#filter-authority",
          "#filter-category",
          "#filter-temporal"
        ].forEach(sel => {
          $(sel).value = "";
        });

        renderRegistry();
      });

    $("#export-csv")
      ?.addEventListener(
        "click",
        exportCSV
      );

    $("#close-dialog")
      ?.addEventListener(
        "click",
        () => $("#detail-dialog").close()
      );

    $("#registry-body")
      ?.addEventListener("click", e => {
        if (e.target.closest("a")) return;

        const row = e.target.closest("tr[data-id]");

        if (row) {
          openDetail(
            records.find(
              r => r.record_id === row.dataset.id
            )
          );
        }
      });

    $("#registry-body")
      ?.addEventListener("keydown", e => {
        if (
          e.key !== "Enter" &&
          e.key !== " "
        ) return;

        if (e.target.closest("a")) return;

        const row = e.target.closest("tr[data-id]");

        if (row) {
          e.preventDefault();

          openDetail(
            records.find(
              r => r.record_id === row.dataset.id
            )
          );
        }
      });
  }

  function initControls() {
    const jurisdictions =
      unique("jurisdiction_or_scope")
        .map(v => ({
          value: v,
          label: v
        }));

    const ingredientOptions =
      ingredients().map(i => ({
        value: i.slug,
        label:
          `${i.name}${
            i.code ? ` · ${i.code}` : ""
          }`
      }));

    fillSelect(
      $("#jurisdiction-a"),
      jurisdictions,
      data.reg_all
    );

    fillSelect(
      $("#jurisdiction-b"),
      jurisdictions,
      data.reg_all
    );

    fillSelect(
      $("#compare-substance"),
      ingredientOptions,
      data.reg_all
    );

    fillSelect(
      $("#filter-jurisdiction"),
      jurisdictions,
      data.reg_all
    );

    fillSelect(
      $("#filter-substance"),
      ingredientOptions,
      data.reg_all
    );

    fillSelect(
      $("#filter-authority"),
      unique("authority").map(v => ({
        value: v,
        label: v
      })),
      data.reg_all
    );

    fillSelect(
      $("#filter-category"),
      unique("measure_type").map(v => ({
        value: v,
        label: v
      })),
      data.reg_all
    );

    fillSelect(
      $("#filter-temporal"),
      unique("measure_status").map(v => ({
        value: v,
        label: v
      })),
      data.reg_all
    );

    const preferredA =
      jurisdictions.find(
        x => x.value === "European Union"
      )?.value ||
      jurisdictions[0]?.value ||
      "";

    const preferredB =
      jurisdictions.find(
        x => x.value === "United States"
      )?.value ||
      jurisdictions[1]?.value ||
      preferredA;

    $("#jurisdiction-a").value = preferredA;
    $("#jurisdiction-b").value = preferredB;

    const params =
      new URLSearchParams(location.search);

    const requestedIngredient =
      params.get("ingredient");

    if (
      requestedIngredient &&
      ingredientOptions.some(
        x => x.value === requestedIngredient
      )
    ) {
      $("#compare-substance").value =
        requestedIngredient;

      $("#filter-substance").value =
        requestedIngredient;
    }
  }

  async function init() {
    currentLang = requestedLanguage();

    const loaded =
      await fetchData(currentLang);

    data = loaded.payload;
    currentLang = loaded.loadedLang;

    records =
      Array.isArray(data.records)
        ? data.records
        : [];

    document.documentElement.lang =
      currentLang;

    document.documentElement.dir =
      RTL.has(currentLang)
        ? "rtl"
        : "ltr";

    document.body.dir =
      RTL.has(currentLang)
        ? "rtl"
        : "ltr";

    const select = $("#lang-select");

    if (select) {
      select.value = currentLang;
    }

    applyText(data);
    initControls();
    bindEvents();
    renderComparison();
    renderRegistry();
  }

  init().catch(err => {
    console.error(
      "BOTIA Regulatory could not load:",
      err
    );

    const target = $("#registry-body");

    if (target) {
      target.innerHTML = `
        <tr>
          <td colspan="6">
            Could not load regulatory data.
          </td>
        </tr>
      `;
    }
  });
})();
