// BOTIA shared footer
(() => {
  "use strict";

  const RUNTIME_KEY = "__botiaSharedFooterRuntime";
  if (window[RUNTIME_KEY]?.bootstrapped) return;
  window[RUNTIME_KEY] = { bootstrapped: true };

  const SUPPORTED_LANGUAGES = new Set([
    "en", "es", "ar", "de", "fr", "nl", "it", "pt",
    "pl", "ro", "ru", "tr", "zh", "id"
  ]);

  const COMPANY = {
    name: "ServiceHub",
    street: "Kolvelseweg 165",
    postcode: "5025 JD Tilburg",
    country: "Nederland",
    kvk: "42023784",
    email: "soporte@botia-safefood.com",
    year: "2026"
  };

  const normaliseLanguage = value => {
    const language = String(value || "").toLowerCase().split("-")[0];
    return SUPPORTED_LANGUAGES.has(language) ? language : "en";
  };

  const currentLanguage = () => {
    const queryLanguage = new URLSearchParams(window.location.search).get("lang");
    if (queryLanguage) return normaliseLanguage(queryLanguage);

    try {
      const storedLanguage = localStorage.getItem("botia-lang");
      if (storedLanguage) return normaliseLanguage(storedLanguage);
    } catch (_) {
      // localStorage can be unavailable in some WebViews.
    }

    return normaliseLanguage(document.documentElement.lang || navigator.language);
  };

  const loadLabels = language => {
    const fetchLanguage = lang => fetch(`/i18n/${lang}/landing.json`)
      .then(response => {
        if (!response.ok) throw new Error(`Translation request failed: ${response.status}`);
        return response.json();
      });

    return fetchLanguage(language)
      .catch(() => language === "en" ? {} : fetchLanguage("en"));
  };

  const t = (labels, key, fallback) => labels[key] || fallback;

  const preserveLanguage = (path, language) => {
    const url = new URL(path, window.location.origin);
    url.searchParams.set("lang", language);
    return `${url.pathname}${url.search}${url.hash}`;
  };

  const buildFooter = (labels, language) => {
    const footer = document.createElement("footer");
    footer.className = "botia-footer";

    const grid = document.createElement("div");
    grid.className = "footer-grid";

    // ---- Column 1: Company ----
    const colCompany = document.createElement("div");
    colCompany.className = "footer-col";
    colCompany.innerHTML = `
      <h4 class="footer-title">${t(labels, "footer_company_title", "Company")}</h4>
      <p class="footer-text">${COMPANY.name}</p>
      <p class="footer-text">${COMPANY.street}</p>
      <p class="footer-text">${COMPANY.postcode}</p>
      <p class="footer-text">${COMPANY.country}</p>
      <p class="footer-text">${t(labels, "footer_kvk_label", "KvK")} ${COMPANY.kvk}</p>
    `;

    // ---- Column 2: Contact ----
    const colContact = document.createElement("div");
    colContact.className = "footer-col";
    colContact.innerHTML = `
      <h4 class="footer-title">${t(labels, "footer_contact_title", "Contact")}</h4>
      <p class="footer-text"><a href="mailto:${COMPANY.email}">${COMPANY.email}</a></p>
    `;

    // ---- Column 3: Legal ----
    const colLegal = document.createElement("div");
    colLegal.className = "footer-col";
    colLegal.innerHTML = `
      <h4 class="footer-title">${t(labels, "footer_legal_title", "Legal")}</h4>
      <p class="footer-text"><a href="${preserveLanguage("/privacy.html", language)}">${t(labels, "footer_privacy", "Privacy Policy")}</a></p>
      <p class="footer-text"><a href="${preserveLanguage("/legal.html", language)}">${t(labels, "footer_notice", "Legal Notice")}</a></p>
    `;

    // ---- Column 4: Try BOTIA ----
    const colTry = document.createElement("div");
    colTry.className = "footer-col";
    colTry.innerHTML = `
      <h4 class="footer-title">${t(labels, "footer_try_title", "Try BOTIA")}</h4>
      <p class="footer-text"><a href="${preserveLanguage("/try.html", language)}">${t(labels, "footer_try_cta", "Try BOTIA")}</a></p>
      <p class="footer-text">${t(labels, "footer_try_desc", "Photograph the label. Discover what it doesn't say.")}</p>
    `;

    const footerColumns = [colCompany, colContact, colLegal];
    if (!window.location.pathname.endsWith("/try.html")) {
      footerColumns.push(colTry);
    }
    grid.append(...footerColumns);

    // ---- Bottom ----
    const bottom = document.createElement("div");
    bottom.className = "footer-bottom";
    bottom.innerHTML = `
      <p>${t(labels, "footer_disclaimer", "BOTIA does not replace WHO, EFSA, the European Commission, FDA, or scientific literature. It translates complex food evidence into information that can be used while reading a label.")}</p>
      <p class="footer-copy">© ${COMPANY.year} ${COMPANY.name} · BOTIA</p>
    `;

    footer.append(grid, bottom);
    return footer;
  };

  const initialise = async () => {
    // Remove a stale footer if the script ran twice.
    document.querySelectorAll("footer.botia-footer").forEach(node => node.remove());

    const language = currentLanguage();

    try {
      const labels = await loadLabels(language);
      const footer = buildFooter(labels, language);

      const main = document.querySelector("main");
      if (main) {
        main.insertAdjacentElement("afterend", footer);
      } else {
        document.body.appendChild(footer);
      }
    } catch (error) {
      console.error("BOTIA footer could not be loaded.", error);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise, { once: true });
  } else {
    initialise();
  }
})();
