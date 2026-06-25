// BOTIA i18n Loader - CURRENT STRUCTURE
// Loads translations from /botia/[product]/i18n/[lang].json

const BOTIA_SUPPORTED_LANGS = [
  "en", "es", "fr", "de", "nl", "it", "pt", "pl", "ro", "ar", "zh", "ru", "tr", "id"
];

const BOTIA_UI_TEXT = {
  en: {
    detected: "What BOTIA detected",
    matters: "Why it matters",
    cannot: "Label limits",
    sources: "Context",
    note: "Note"
  },
  es: {
    detected: "Qué ha detectado BOTIA",
    matters: "Por qué importa",
    cannot: "Límites de la etiqueta",
    sources: "Contexto",
    note: "Nota"
  },
  fr: {
    detected: "Ce que BOTIA a détecté",
    matters: "Pourquoi c'est important",
    cannot: "Limites de l’étiquette",
    sources: "Contexte",
    note: "Remarque"
  },
  de: {
    detected: "Was BOTIA erkannt hat",
    matters: "Warum es wichtig ist",
    cannot: "Grenzen des Etiketts",
    sources: "Kontext",
    note: "Hinweis"
  },
  nl: {
    detected: "Wat BOTIA heeft gedetecteerd",
    matters: "Waarom het belangrijk is",
    cannot: "Grenzen van het etiket",
    sources: "Context",
    note: "Opmerking"
  },
  it: {
    detected: "Cosa ha rilevato BOTIA",
    matters: "Perché è importante",
    cannot: "Limiti dell’etichetta",
    sources: "Contesto",
    note: "Nota"
  },
  pt: {
    detected: "O que a BOTIA detectou",
    matters: "Por que é importante",
    cannot: "Limites do rótulo",
    sources: "Contexto",
    note: "Nota"
  },
  pl: {
    detected: "Co wykryła BOTIA",
    matters: "Dlaczego to ważne",
    cannot: "Ograniczenia etykiety",
    sources: "Kontekst",
    note: "Uwaga"
  },
  ro: {
    detected: "Ce a detectat BOTIA",
    matters: "De ce este important",
    cannot: "Limitele etichetei",
    sources: "Context",
    note: "Notă"
  },
  ar: {
    detected: "ما الذي اكتشفه BOTIA",
    matters: "لماذا يهم",
    cannot: "حدود الملصق",
    sources: "السياق",
    note: "ملاحظة"
  },
  zh: {
    detected: "BOTIA检测到的内容",
    matters: "为什么重要",
    cannot: "标签的限制",
    sources: "背景",
    note: "说明"
  },
  ru: {
    detected: "Что обнаружила BOTIA",
    matters: "Почему это важно",
    cannot: "Ограничения этикетки",
    sources: "Контекст",
    note: "Примечание"
  },
  tr: {
    detected: "BOTIA'nın tespit ettikleri",
    matters: "Neden önemli",
    cannot: "Etiketin sınırları",
    sources: "Bağlam",
    note: "Not"
  },
  id: {
    detected: "Apa yang dideteksi BOTIA",
    matters: "Mengapa ini penting",
    cannot: "Batas label",
    sources: "Konteks",
    note: "Catatan"
  }
};

function normalizeLanguage(lang) {
  if (!lang) return "en";
  lang = lang.toLowerCase().split("-")[0];
  return BOTIA_SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) {
    element.textContent = value;
  }
}

function setHref(id, value) {
  const element = document.getElementById(id);
  if (element && value) {
    element.href = value;
  }
}

function applyUiText(lang) {
  const ui = BOTIA_UI_TEXT[lang] || BOTIA_UI_TEXT.en;

  setText("label_detected", ui.detected);
  setText("label_matters", ui.matters);
  setText("label_cannot", ui.cannot);
  setText("label_sources", ui.sources);
  setText("label_note", ui.note);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

async function loadTranslations(product, ingredientCode, lang) {
  try {
    lang = normalizeLanguage(lang);
    applyUiText(lang);

    const jsonPath = `/botia/${product}/i18n/${lang}.json`;
    console.log(`Loading: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) {
      throw new Error(`Failed to load ${jsonPath} (HTTP ${response.status})`);
    }

    const translations = await response.json();
    const data = translations[ingredientCode];

    if (!data) {
      console.warn(`No translations found for ${ingredientCode} in ${product}/${lang}`);
      return false;
    }

    Object.keys(data).forEach(key => {
      // WebView decision: this field stays in JSON but is not shown on screen.
      if (key === "short_message") return;

      const element = document.getElementById(key);
      if (!element) return;

      if (element.tagName === "A") {
        element.href = data[key];
      } else if (element.tagName === "IMG") {
        element.alt = data[key];
      } else {
        element.textContent = data[key];
      }
    });

    localStorage.setItem("botia-lang", lang);
    return true;

  } catch (error) {
    console.error("BOTIA translation loading error:", error);
    return false;
  }
}

function detectLanguage() {
  const urlParams = new URLSearchParams(window.location.search);
  const langFromUrl = urlParams.get("lang");
  if (langFromUrl) return normalizeLanguage(langFromUrl);

  const langFromStorage = localStorage.getItem("botia-lang");
  if (langFromStorage) return normalizeLanguage(langFromStorage);

  const browserLang = navigator.language.split("-")[0];
  return normalizeLanguage(browserLang);
}

window.BOTIA = {
  loadTranslations,
  detectLanguage
};
