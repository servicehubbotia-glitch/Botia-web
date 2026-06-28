// BOTIA Web Loader — v3 (data-i18n + ruta relativa)
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

function detectWebLanguage() {
  const langFromUrl = getWebUrlParam("lang");
  if (langFromUrl) return normalizeWebLang(langFromUrl);
  const langFromStorage = localStorage.getItem("botia-lang");
  if (langFromStorage) return normalizeWebLang(langFromStorage);
  const browserLang = navigator.language.split("-")[0];
  return normalizeWebLang(browserLang);
}

function getNestedValue(obj, key) {
  return key.split('.').reduce((o, k) => (o || {})[k], obj);
}

function renderBotiaContent(data) {
  const elements = document.querySelectorAll('[data-i18n]');
  elements.forEach(el => {
    const key = el.getAttribute('data-i18n');
    const value = getNestedValue(data, key);
    if (value !== undefined) {
      if (Array.isArray(value)) {
        el.innerHTML = value.map(item => `<span>${item}</span>`).join(' • ');
      } else {
        el.textContent = value;
      }
    }
  });
}

async function initBotia() {
  try {
    const lang = detectWebLanguage();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

    const jsonPath = `./i18n/${lang}.json`;
    console.log(`[BOTIA] Cargando: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const data = await response.json();
    const content = data.page || data.status || data.landing || data;

    renderBotiaContent(content);

    if (content.title) {
      document.title = `BOTIA · ${content.title}`;
    }

    localStorage.setItem("botia-lang", lang);
  } catch (error) {
    console.error("[BOTIA ERROR]", error);
  }
}

document.addEventListener('DOMContentLoaded', initBotia);

window.BOTIA_WEB = {
  init: initBotia,
  detectLanguage: detectWebLanguage,
};
