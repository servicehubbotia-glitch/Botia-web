// BOTIA Web Loader
// Loads translations from /botia/library/[module]/i18n/[lang].json
// For informational web pages (not WebView)

const BOTIA_WEB_SUPPORTED_LANGS = [
  "en", "es", "fr", "de", "nl", "it", "pt", "pl", "ro", "ar", "zh", "ru", "tr", "id"
];

function normalizeWebLang(lang) {
  if (!lang) return "en";
  lang = lang.toLowerCase().split("-")[0];
  return BOTIA_WEB_SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

function getWebUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function setWebText(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.textContent = value;
}

function setWebHtml(id, value) {
  const el = document.getElementById(id);
  if (el && value) el.innerHTML = value;
}

function detectWebLanguage() {
  const langFromUrl = getWebUrlParam("lang");
  if (langFromUrl) return normalizeWebLang(langFromUrl);

  const langFromStorage = localStorage.getItem("botia-lang");
  if (langFromStorage) return normalizeWebLang(langFromStorage);

  const browserLang = navigator.language.split("-")[0];
  return normalizeWebLang(browserLang);
}

function renderWebList(id, items, icon) {
  const el = document.getElementById(id);
  if (!el || !items) return;
  el.innerHTML = "";
  const ul = document.createElement("ul");
  items.forEach(item => {
    const li = document.createElement("li");
    li.textContent = icon ? `${icon} ${item}` : item;
    ul.appendChild(li);
  });
  el.appendChild(ul);
}

function renderRelatedGrid(id, links, basePath) {
  const el = document.getElementById(id);
  if (!el || !links) return;
  el.innerHTML = "";
  links.forEach(link => {
    const a = document.createElement("a");
    const slug = link.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    a.href = `${basePath}/${slug}.html`;
    a.textContent = link;
    el.appendChild(a);
  });
}

async function loadWebPage(module, pageKey, basePath) {
  try {
    const lang = detectWebLanguage();

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // ✅ RUTA CORREGIDA
    const jsonPath = `/botia/library/${module}/i18n/${lang}.json`;
    console.log(`Loading web page: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Failed to load ${jsonPath}`);

    const translations = await response.json();
    const data = translations[pageKey];

    if (!data) {
      console.warn(`No data found for ${pageKey} in ${module}/${lang}`);
      return false;
    }

    // Recorre todas las keys del JSON y rellena los IDs
    function processObject(obj, prefix) {
      Object.keys(obj).forEach(key => {
        const fullId = prefix ? `${prefix}_${key}` : key;
        const value = obj[key];

        if (Array.isArray(value)) {
          renderWebList(fullId, value);
        } else if (typeof value === "object" && value !== null) {
          processObject(value, fullId);
        } else {
          setWebText(fullId, value);
        }
      });
    }

    processObject(data, null);

    // Related grid si existe
    if (data.related && data.related.links) {
      renderRelatedGrid("related_grid", data.related.links, basePath || "/botia");
    }

    localStorage.setItem("botia-lang", lang);
    return true;

  } catch (error) {
    console.error("BOTIA web loader error:", error);
    return false;
  }
}

window.BOTIA_WEB = {
  loadWebPage,
  detectWebLanguage
};
