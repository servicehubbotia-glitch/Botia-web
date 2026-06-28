// BOTIA Web Loader — v2 (relative path)
// Carga JSON desde ./i18n/[lang].json relativo al HTML que lo invoca

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
  if (el && value !== undefined && value !== null) el.textContent = value;
}

function detectWebLanguage() {
  const langFromUrl = getWebUrlParam("lang");
  if (langFromUrl) return normalizeWebLang(langFromUrl);

  const langFromStorage = localStorage.getItem("botia-lang");
  if (langFromStorage) return normalizeWebLang(langFromStorage);

  const browserLang = navigator.language.split("-")[0];
  return normalizeWebLang(browserLang);
}

function renderRelatedGrid(links) {
  const container = document.getElementById("related_grid");
  if (!container || !links) return;
  container.innerHTML = "";
  links.forEach(link => {
    const a = document.createElement("a");
    const slug = link.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    // Enlaces absolutos desde la raíz del sitio
    a.href = `/webviews/${slug}.html`;
    a.textContent = link;
    container.appendChild(a);
  });
}

async function loadWebPage(pageKey) {
  try {
    const lang = detectWebLanguage();

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    // ✅ RUTA RELATIVA — el JSON debe estar en ./i18n/[lang].json
    const jsonPath = `./i18n/${lang}.json`;
    console.log(`[BOTIA] Cargando: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${jsonPath}`);

    const translations = await response.json();
    const data = translations[pageKey];

    if (!data) {
      console.warn(`[BOTIA] No se encontró la clave "${pageKey}" en el JSON.`);
      return false;
    }

    // Recorre recursivamente el objeto y asigna valores a los elementos del DOM
    function processObject(obj, prefix = "") {
      Object.keys(obj).forEach(key => {
        const fullId = prefix ? `${prefix}_${key}` : key;
        const value = obj[key];

        if (value !== null && typeof value === "object" && !Array.isArray(value)) {
          processObject(value, fullId);
        } else {
          const element = document.getElementById(fullId);
          if (element) {
            if (Array.isArray(value)) {
              // Si es array, lo convertimos a lista (ej. ingredientes)
              element.innerHTML = value.map(item => `<li>${item}</li>`).join("");
            } else {
              element.textContent = value;
            }
          } else {
            // No advertimos de elementos no encontrados para no saturar la consola
          }
        }
      });
    }

    processObject(data);

    // Renderiza enlaces relacionados si existen
    if (data.related && data.related.links) {
      renderRelatedGrid(data.related.links);
    }

    // Actualiza título de la pestaña
    if (data.title) {
      document.title = `BOTIA · ${data.title}`;
    }

    localStorage.setItem("botia-lang", lang);
    return true;

  } catch (error) {
    console.error(`[BOTIA] Error cargando la página:`, error);
    return false;
  }
}

window.BOTIA_WEB = {
  loadWebPage,
  detectWebLanguage
};
