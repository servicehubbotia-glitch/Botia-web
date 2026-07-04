// BOTIA i18n Loader - FINAL
// Loads translations from /i18n/[lang]/[ingredientCode].json

const BOTIA_SUPPORTED_LANGS = [
  "en", "es", "fr", "de", "nl", "it", "pt", "pl", "ro", "ar", "zh", "ru", "tr", "id"
];

const BOTIA_UI_TEXT = {
  en: { detected: "What BOTIA detected", matters: "Why it matters", cannot: "Label limits", sources: "Context", note: "Note", ingredient: "Ingredient", ingredients: "Ingredients", disclaimer: "BOTIA informs based on the ingredients read from the label.", more_info: "More about" },
  es: { detected: "Qué ha detectado BOTIA", matters: "Por qué importa", cannot: "Límites de la etiqueta", sources: "Contexto", note: "Nota", ingredient: "Ingrediente", ingredients: "Ingredientes", disclaimer: "BOTIA informa a partir de los ingredientes leídos en la etiqueta.", more_info: "Más información sobre" },
  fr: { detected: "Ce que BOTIA a détecté", matters: "Pourquoi c'est important", cannot: "Limites de l'étiquette", sources: "Contexte", note: "Remarque", ingredient: "Ingrédient", ingredients: "Ingrédients", disclaimer: "BOTIA informe à partir des ingrédients lus sur l'étiquette.", more_info: "En savoir plus sur" },
  de: { detected: "Was BOTIA erkannt hat", matters: "Warum es wichtig ist", cannot: "Grenzen des Etiketts", sources: "Kontext", note: "Hinweis", ingredient: "Zutat", ingredients: "Zutaten", disclaimer: "BOTIA informiert auf Grundlage der auf dem Etikett gelesenen Zutaten.", more_info: "Mehr über" },
  nl: { detected: "Wat BOTIA heeft gedetecteerd", matters: "Waarom het belangrijk is", cannot: "Grenzen van het etiket", sources: "Context", note: "Opmerking", ingredient: "Ingrediënt", ingredients: "Ingrediënten", disclaimer: "BOTIA informeert op basis van de ingrediënten die op het etiket zijn gelezen.", more_info: "Meer over" },
  it: { detected: "Cosa ha rilevato BOTIA", matters: "Perché è importante", cannot: "Limiti dell'etichetta", sources: "Contesto", note: "Nota", ingredient: "Ingrediente", ingredients: "Ingredienti", disclaimer: "BOTIA informa sulla base degli ingredienti letti sull'etichetta.", more_info: "Maggiori informazioni su" },
  pt: { detected: "O que a BOTIA detectou", matters: "Por que é importante", cannot: "Limites do rótulo", sources: "Contexto", note: "Nota", ingredient: "Ingrediente", ingredients: "Ingredientes", disclaimer: "A BOTIA informa com base nos ingredientes lidos no rótulo.", more_info: "Mais informações sobre" },
  pl: { detected: "Co wykryła BOTIA", matters: "Dlaczego to ważne", cannot: "Ograniczenia etykiety", sources: "Kontekst", note: "Uwaga", ingredient: "Składnik", ingredients: "Składniki", disclaimer: "BOTIA informuje na podstawie składników odczytanych z etykiety.", more_info: "Więcej o" },
  ro: { detected: "Ce a detectat BOTIA", matters: "De ce este important", cannot: "Limitele etichetei", sources: "Context", note: "Notă", ingredient: "Ingredient", ingredients: "Ingrediente", disclaimer: "BOTIA informează pe baza ingredientelor citite de pe etichetă.", more_info: "Mai multe despre" },
  ar: { detected: "ما الذي اكتشفه BOTIA", matters: "لماذا يهم", cannot: "حدود الملصق", sources: "السياق", note: "ملاحظة", ingredient: "المكوّن", ingredients: "المكوّنات", disclaimer: "تقدّم BOTIA معلومات بناءً على المكوّنات المقروءة على الملصق.", more_info: "مزيد من المعلومات عن" },
  zh: { detected: "BOTIA检测到的内容", matters: "为什么重要", cannot: "标签的限制", sources: "背景", note: "说明", ingredient: "配料", ingredients: "配料", disclaimer: "BOTIA基于标签上读取到的配料提供信息。", more_info: "了解更多关于" },
  ru: { detected: "Что обнаружила BOTIA", matters: "Почему это важно", cannot: "Ограничения этикетки", sources: "Контекст", note: "Примечание", ingredient: "Ингредиент", ingredients: "Ингредиенты", disclaimer: "BOTIA предоставляет информацию на основе ингредиентов, прочитанных на этикетке.", more_info: "Подробнее о" },
  tr: { detected: "BOTIA'nın tespit ettikleri", matters: "Neden önemli", cannot: "Etiketin sınırları", sources: "Bağlam", note: "Not", ingredient: "İçerik", ingredients: "İçerikler", disclaimer: "BOTIA, etiketten okunan içeriklere dayanarak bilgi verir.", more_info: "Hakkında daha fazla" },
  id: { detected: "Apa yang dideteksi BOTIA", matters: "Mengapa ini penting", cannot: "Batas label", sources: "Konteks", note: "Catatan", ingredient: "Bahan", ingredients: "Bahan", disclaimer: "BOTIA memberikan informasi berdasarkan bahan yang terbaca pada label.", more_info: "Informasi lebih lanjut tentang" }
};

function normalizeLanguage(lang) {
  if (!lang) return "en";
  lang = lang.toLowerCase().split("-")[0];
  return BOTIA_SUPPORTED_LANGS.includes(lang) ? lang : "en";
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element && value) element.textContent = value;
}

function getUrlParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function renderHeaderTrigger(lang) {
  const container = document.getElementById("header_trigger_container");
  if (!container) return;

  const trigger = getUrlParam("trigger");
  if (!trigger) return;

  const items = trigger.split(",").map(i => i.trim()).filter(Boolean);
  const p = document.createElement("p");
  p.className = "botia-header-trigger";
  p.textContent = items.join(" · ");
  container.appendChild(p);
}

function renderIngredientTrigger(lang, product) {
  const container = document.getElementById("ingredient_link_container");
  if (!container) {
    console.warn("ingredient_link_container not found in DOM");
    return;
  }

  const trigger = getUrlParam("trigger");
  if (!trigger) {
    container.innerHTML = "";
    return;
  }

  const ui = BOTIA_UI_TEXT[lang] || BOTIA_UI_TEXT.en;
  const items = trigger
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);

  container.innerHTML = "";

  const ul = document.createElement("ul");
  ul.className = "botia-trigger-list";

  items.forEach((item, index) => {
    const slug = item
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const a = document.createElement("a");
    a.href = `/ingredients/${slug}.html?lang=${lang}`;
    a.textContent = `${ui.more_info} ${item}`;
    a.target = "_blank";
    const li = document.createElement("li");
    li.appendChild(a);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}

function applyUiText(lang) {
  const ui = BOTIA_UI_TEXT[lang] || BOTIA_UI_TEXT.en;

  setText("label_detected", ui.detected);
  setText("label_matters", ui.matters);
  setText("label_cannot", ui.cannot);
  setText("label_sources", ui.sources);
  setText("label_note", ui.note);
  setText("botia_disclaimer", ui.disclaimer);

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
}

async function loadTranslations(product, ingredientCode, lang) {
  try {
    lang = normalizeLanguage(lang);
    applyUiText(lang);
    renderHeaderTrigger(lang);
    renderIngredientTrigger(lang, product);

    const jsonPath = `/i18n/${lang}/${ingredientCode}.json`;
    console.log(`Loading: ${jsonPath}`);

    const response = await fetch(jsonPath);
    if (!response.ok) throw new Error(`Failed to load ${jsonPath} (HTTP ${response.status})`);

    const data = await response.json();

    if (!data) {
      console.warn(`No translations found for ${ingredientCode} in ${lang}`);
      return false;
    }

    Object.keys(data).forEach(key => {
      if (key === "short_message") return;
      const element = document.getElementById(key);
      if (!element) return;
      element.textContent = data[key];
    });

    localStorage.setItem("botia-lang", lang);
    return true;

  } catch (error) {
    console.error("BOTIA translation loading error:", error);
    return false;
  }
}

function detectLanguage() {
  const langFromUrl = getUrlParam("lang");
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
