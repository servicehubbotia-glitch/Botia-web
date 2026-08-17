// BOTIA unified i18n loader
(() => {
  "use strict";

  const RUNTIME_KEY = "__botiaI18nRuntime";
  if (window[RUNTIME_KEY]?.bootstrapped) return;
  const runtime = window[RUNTIME_KEY] = { bootstrapped: true, initPromise: null };

  const LANGS = ["en", "es", "ar", "de", "fr", "nl", "it", "pt", "pl", "ro", "ru", "tr", "zh", "id"];
  const RTL = new Set(["ar"]);

  const LAYER_ROUTES = {
    muslim: "/pages/muslim.html",
    woman: "/pages/woman.html",
    animal: "/pages/animal.html",
    sugar: "/ingredients/sugar.html",
    sweetener: "/ingredients/sweetener.html",
    texture: "/ingredients/texture.html",
    flavour: "/ingredients/flavor.html",
    flavor: "/ingredients/flavor.html",
    enumbers: "/ingredients/enumbers.html"
  };

  const LAYER_LABELS = {
    en: {
      muslim: "Muslim",
      animal: "Animal",
      sugar: "Sugar",
      sweetener: "Sweetener",
      texture: "Texture",
      flavour: "Flavour",
      enumbers: "E-numbers",
      woman: "Woman"
    },

    es: {
      muslim: "Musulmán",
      animal: "Animal",
      sugar: "Azúcar",
      sweetener: "Edulcorante",
      texture: "Textura",
      flavour: "Aromas",
      enumbers: "Números E",
      woman: "Mujer"
    },

    ar: {
      muslim: "مسلم",
      animal: "حيواني",
      sugar: "سكر",
      sweetener: "مُحلّي",
      texture: "قوام",
      flavour: "نكهات",
      enumbers: "أرقام E",
      woman: "المرأة"
    },

    de: {
      muslim: "Muslim",
      animal: "Tierisch",
      sugar: "Zucker",
      sweetener: "Süßstoff",
      texture: "Textur",
      flavour: "Aromen",
      enumbers: "E-Nummern",
      woman: "Frau"
    },

    fr: {
      muslim: "Musulman",
      animal: "Animal",
      sugar: "Sucre",
      sweetener: "Édulcorant",
      texture: "Texture",
      flavour: "Arômes",
      enumbers: "Numéros E",
      woman: "Femme"
    },

    nl: {
      muslim: "Moslim",
      animal: "Dierlijk",
      sugar: "Suiker",
      sweetener: "Zoetstof",
      texture: "Textuur",
      flavour: "Aroma's",
      enumbers: "E-nummers",
      woman: "Vrouw"
    },

    it: {
      muslim: "Musulmano",
      animal: "Animale",
      sugar: "Zucchero",
      sweetener: "Dolcificante",
      texture: "Consistenza",
      flavour: "Aromi",
      enumbers: "Numeri E",
      woman: "Donna"
    },

    pt: {
      muslim: "Muçulmano",
      animal: "Animal",
      sugar: "Açúcar",
      sweetener: "Edulcorante",
      texture: "Textura",
      flavour: "Aromas",
      enumbers: "Números E",
      woman: "Mulher"
    },

    pl: {
      muslim: "Muzułmański",
      animal: "Zwierzęce",
      sugar: "Cukier",
      sweetener: "Słodzik",
      texture: "Tekstura",
      flavour: "Aromaty",
      enumbers: "Numery E",
      woman: "Kobieta"
    },

    ro: {
      muslim: "Musulman",
      animal: "Animal",
      sugar: "Zahăr",
      sweetener: "Îndulcitor",
      texture: "Textură",
      flavour: "Arome",
      enumbers: "Numere E",
      woman: "Femeie"
    },

    ru: {
      muslim: "Мусульманский",
      animal: "Животное",
      sugar: "Сахар",
      sweetener: "Подсластитель",
      texture: "Текстура",
      flavour: "Ароматизаторы",
      enumbers: "E-номера",
      woman: "Женщина"
    },

    tr: {
      muslim: "Müslüman",
      animal: "Hayvansal",
      sugar: "Şeker",
      sweetener: "Tatlandırıcı",
      texture: "Doku",
      flavour: "Aroma",
      enumbers: "E numaraları",
      woman: "Kadın"
    },

    zh: {
      muslim: "穆斯林",
      animal: "动物源",
      sugar: "糖",
      sweetener: "甜味剂",
      texture: "质地",
      flavour: "香料",
      enumbers: "E编号",
      woman: "女性"
    },

    id: {
      muslim: "Muslim",
      animal: "Hewani",
      sugar: "Gula",
      sweetener: "Pemanis",
      texture: "Tekstur",
      flavour: "Perisa",
      enumbers: "Nomor E",
      woman: "Perempuan"
    }
  };

  // Shared labels used by the Halal / Haram / Mashbooh WebViews.
  const UI_TEXT = {
    en: { detected: "What BOTIA detected", matters: "Why it matters", cannot: "Label limits", sources: "Context", note: "Note", disclaimer: "BOTIA informs based on the ingredients read from the label.", more_info: "More about", what_is: "What it is", why_botia: "Why BOTIA flags it", can: "BOTIA CAN", cannot_do: "BOTIA CANNOT", sources_title: "Sources", back: "← Back", select_language: "Select language" },
    es: { detected: "Qué ha detectado BOTIA", matters: "Por qué importa", cannot: "Límites de la etiqueta", sources: "Contexto", note: "Nota", disclaimer: "BOTIA informa a partir de los ingredientes leídos en la etiqueta.", more_info: "Más información sobre", what_is: "Qué es", why_botia: "Por qué BOTIA lo señala", can: "BOTIA PUEDE", cannot_do: "BOTIA NO PUEDE", sources_title: "Fuentes", back: "← Volver", select_language: "Seleccionar idioma" },
    fr: { detected: "Ce que BOTIA a détecté", matters: "Pourquoi c'est important", cannot: "Limites de l'étiquette", sources: "Contexte", note: "Remarque", disclaimer: "BOTIA informe à partir des ingrédients lus sur l'étiquette.", more_info: "En savoir plus sur", what_is: "Ce que c'est", why_botia: "Pourquoi BOTIA le signale", can: "BOTIA PEUT", cannot_do: "BOTIA NE PEUT PAS", sources_title: "Sources", back: "← Retour", select_language: "Sélectionner la langue" },
    de: { detected: "Was BOTIA erkannt hat", matters: "Warum es wichtig ist", cannot: "Grenzen des Etiketts", sources: "Kontext", note: "Hinweis", disclaimer: "BOTIA informiert auf Grundlage der auf dem Etikett gelesenen Zutaten.", more_info: "Mehr über", what_is: "Was es ist", why_botia: "Warum BOTIA es kennzeichnet", can: "BOTIA KANN", cannot_do: "BOTIA KANN NICHT", sources_title: "Quellen", back: "← Zurück", select_language: "Sprache auswählen" },
    nl: { detected: "Wat BOTIA heeft gedetecteerd", matters: "Waarom het belangrijk is", cannot: "Grenzen van het etiket", sources: "Context", note: "Opmerking", disclaimer: "BOTIA informeert op basis van de ingrediënten die op het etiket zijn gelezen.", more_info: "Meer over", what_is: "Wat het is", why_botia: "Waarom BOTIA het markeert", can: "BOTIA KAN", cannot_do: "BOTIA KAN NIET", sources_title: "Bronnen", back: "← Terug", select_language: "Taal selecteren" },
    it: { detected: "Cosa ha rilevato BOTIA", matters: "Perché è importante", cannot: "Limiti dell'etichetta", sources: "Contesto", note: "Nota", disclaimer: "BOTIA informa sulla base degli ingredienti letti sull'etichetta.", more_info: "Maggiori informazioni su", what_is: "Cos'è", why_botia: "Perché BOTIA lo segnala", can: "BOTIA PUÒ", cannot_do: "BOTIA NON PUÒ", sources_title: "Fonti", back: "← Indietro", select_language: "Seleziona lingua" },
    pt: { detected: "O que a BOTIA detectou", matters: "Por que é importante", cannot: "Limites do rótulo", sources: "Contexto", note: "Nota", disclaimer: "A BOTIA informa com base nos ingredientes lidos no rótulo.", more_info: "Mais informações sobre", what_is: "O que é", why_botia: "Por que a BOTIA sinaliza", can: "BOTIA PODE", cannot_do: "BOTIA NÃO PODE", sources_title: "Fontes", back: "← Voltar", select_language: "Selecionar idioma" },
    pl: { detected: "Co wykryła BOTIA", matters: "Dlaczego to ważne", cannot: "Ograniczenia etykiety", sources: "Kontekst", note: "Uwaga", disclaimer: "BOTIA informuje na podstawie składników odczytanych z etykiety.", more_info: "Więcej o", what_is: "Co to jest", why_botia: "Dlaczego BOTIA to oznacza", can: "BOTIA MOŻE", cannot_do: "BOTIA NIE MOŻE", sources_title: "Źródła", back: "← Wstecz", select_language: "Wybierz język" },
    ro: { detected: "Ce a detectat BOTIA", matters: "De ce este important", cannot: "Limitele etichetei", sources: "Context", note: "Notă", disclaimer: "BOTIA informează pe baza ingredientelor citite de pe etichetă.", more_info: "Mai multe despre", what_is: "Ce este", why_botia: "De ce BOTIA îl semnalizează", can: "BOTIA POATE", cannot_do: "BOTIA NU POATE", sources_title: "Surse", back: "← Înapoi", select_language: "Selectează limba" },
    ar: { detected: "ما الذي اكتشفه BOTIA", matters: "لماذا يهم", cannot: "حدود الملصق", sources: "السياق", note: "ملاحظة", disclaimer: "تقدّم BOTIA معلومات بناءً على المكوّنات المقروءة على الملصق.", more_info: "مزيد من المعلومات عن", what_is: "ما هو", why_botia: "لماذا تشير إليه BOTIA", can: "يمكن لـ BOTIA", cannot_do: "لا يمكن لـ BOTIA", sources_title: "المصادر", back: "العودة →", select_language: "اختر اللغة" },
    zh: { detected: "BOTIA检测到的内容", matters: "为什么重要", cannot: "标签的限制", sources: "背景", note: "说明", disclaimer: "BOTIA基于标签上读取到的配料提供信息。", more_info: "了解更多关于", what_is: "它是什么", why_botia: "为什么BOTIA会标记它", can: "BOTIA 可以", cannot_do: "BOTIA 不能", sources_title: "来源", back: "← 返回", select_language: "选择语言" },
    ru: { detected: "Что обнаружила BOTIA", matters: "Почему это важно", cannot: "Ограничения этикетки", sources: "Контекст", note: "Примечание", disclaimer: "BOTIA предоставляет информацию на основе ингредиентов, прочитанных на этикетке.", more_info: "Подробнее о", what_is: "Что это такое", why_botia: "Почему BOTIA это отмечает", can: "BOTIA МОЖЕТ", cannot_do: "BOTIA НЕ МОЖЕТ", sources_title: "Источники", back: "← Назад", select_language: "Выбрать язык" },
    tr: { detected: "BOTIA'nın tespit ettikleri", matters: "Neden önemli", cannot: "Etiketin sınırları", sources: "Bağlam", note: "Not", disclaimer: "BOTIA, etiketten okunan içeriklere dayanarak bilgi verir.", more_info: "Hakkında daha fazla", what_is: "Nedir", why_botia: "BOTIA neden işaretler", can: "BOTIA YAPABİLİR", cannot_do: "BOTIA YAPAMAZ", sources_title: "Kaynaklar", back: "← Geri", select_language: "Dil seçin" },
    id: { detected: "Apa yang dideteksi BOTIA", matters: "Mengapa ini penting", cannot: "Batas label", sources: "Konteks", note: "Catatan", disclaimer: "BOTIA memberikan informasi berdasarkan bahan yang terbaca pada label.", more_info: "Informasi lebih lanjut tentang", what_is: "Apa itu", why_botia: "Mengapa BOTIA menandainya", can: "BOTIA BISA", cannot_do: "BOTIA TIDAK BISA", sources_title: "Sumber", back: "← Kembali", select_language: "Pilih bahasa" }
  };
  const NAV_TEXT = {
    en: { sources: "Sources:", back_to_botia: "← Back to BOTIA", back_to_evidence: "← Back to Evidence Layers", skip: "Skip to main content" },
    es: { sources: "Fuentes:", back_to_botia: "← Volver a BOTIA", back_to_evidence: "← Volver a Capas de evidencia", skip: "Saltar al contenido principal" },
    ar: { sources: "المصادر:", back_to_botia: "العودة إلى BOTIA →", back_to_evidence: "العودة إلى طبقات الأدلة →", skip: "الانتقال إلى المحتوى الرئيسي" },
    de: { sources: "Quellen:", back_to_botia: "← Zurück zu BOTIA", back_to_evidence: "← Zurück zu den Evidenzebenen", skip: "Zum Hauptinhalt springen" },
    fr: { sources: "Sources :", back_to_botia: "← Retour à BOTIA", back_to_evidence: "← Retour aux couches de preuves", skip: "Aller au contenu principal" },
    id: { sources: "Sumber:", back_to_botia: "← Kembali ke BOTIA", back_to_evidence: "← Kembali ke lapisan bukti", skip: "Lewati ke konten utama" },
    it: { sources: "Fonti:", back_to_botia: "← Torna a BOTIA", back_to_evidence: "← Torna ai livelli di evidenza", skip: "Vai al contenuto principale" },
    nl: { sources: "Bronnen:", back_to_botia: "← Terug naar BOTIA", back_to_evidence: "← Terug naar bewijslagen", skip: "Ga naar hoofdinhoud" },
    pl: { sources: "Źródła:", back_to_botia: "← Wróć do BOTIA", back_to_evidence: "← Wróć do warstw dowodów", skip: "Przejdź do głównej treści" },
    pt: { sources: "Fontes:", back_to_botia: "← Voltar à BOTIA", back_to_evidence: "← Voltar às camadas de evidência", skip: "Ir para o conteúdo principal" },
    ro: { sources: "Surse:", back_to_botia: "← Înapoi la BOTIA", back_to_evidence: "← Înapoi la straturile de dovezi", skip: "Sari la conținutul principal" },
    ru: { sources: "Источники:", back_to_botia: "← Назад к BOTIA", back_to_evidence: "← Назад к уровням доказательств", skip: "Перейти к основному содержанию" },
    tr: { sources: "Kaynaklar:", back_to_botia: "← BOTIA’ya dön", back_to_evidence: "← Kanıt katmanlarına dön", skip: "Ana içeriğe geç" },
    zh: { sources: "来源：", back_to_botia: "← 返回 BOTIA", back_to_evidence: "← 返回证据层级", skip: "跳到主要内容" }
  };


  const normalise = value => {
    const lang = String(value || "").toLowerCase().split("-")[0];
    return LANGS.includes(lang) ? lang : "en";
  };

  const readStoredLanguage = () => {
    try { return localStorage.getItem("botia-lang"); }
    catch (_) { return null; }
  };

  const storeLanguage = lang => {
    try { localStorage.setItem("botia-lang", lang); }
    catch (_) { /* Storage can be unavailable inside some WebViews. */ }
  };

  const moduleName = () =>
    document.body?.dataset.botiaModule ||
    location.pathname.split("/").pop().replace(/\.html$/i, "") ||
    "landing";

  const language = () => {
    const query = new URLSearchParams(location.search).get("lang");
    if (query) return normalise(query);
    const stored = readStoredLanguage();
    if (stored) return normalise(stored);
    return normalise(navigator.language);
  };

  window.cambiarIdioma = lang => {
    lang = normalise(lang);
    storeLanguage(lang);
    const url = new URL(location.href);
    url.searchParams.set("lang", lang);
    location.href = url.toString();
  };

  const setText = (id, value, html = false) => {
    const el = document.getElementById(id);
    if (!el || value === undefined || value === null || typeof value === "object") return false;
    if (html) el.innerHTML = String(value);
    else el.textContent = String(value);
    return true;
  };

  const specialIds = path => ({
    "halal.name": ["halal_name"],
    "halal.desc": ["halal_desc"],
    "haram.name": ["haram_name"],
    "haram.desc": ["haram_desc"],
    "mashbooh.name": ["mashbooh_name"],
    "mashbooh.desc": ["mashbooh_desc"],
    "mashbooh_why.title": ["mashbooh_why_title"],
    "mashbooh_why.body": ["mashbooh_why_body"],
    "doubts.title": ["doubts_title"],
    "doubts.th_label": ["th_label"],
    "doubts.th_general": ["th_general"],
    "doubts.th_halal": ["th_halal"],
    "doubts.th_botia": ["th_botia"],
    "doubts.row1.aspect": ["td1_aspect"],
    "doubts.row1.general": ["td1_general"],
    "doubts.row1.halal": ["td1_halal"],
    "doubts.row1.botia": ["td1_botia"],
    "doubts.row2.aspect": ["td2_aspect"],
    "doubts.row2.general": ["td2_general"],
    "doubts.row2.halal": ["td2_halal"],
    "doubts.row2.botia": ["td2_botia"],
    "cancannot.title": ["cancannot_title"],
    "closing": ["closing_claim", "closing"]
  })[path];

  const applyLink = (key, value) => {
    if (typeof value !== "string" || !key.endsWith("_link")) return false;
    const direct = document.getElementById(key);
    if (direct?.matches("a")) {
      direct.setAttribute("href", value);
      return true;
    }
    const base = key.slice(0, -5);
    const labelled = document.getElementById(`${base}_name`) || document.getElementById(`${base}_title`);
    const anchor = labelled?.closest("a");
    if (anchor) {
      anchor.setAttribute("href", value);
      return true;
    }
    return false;
  };

  const applyObject = (obj, prefix = "") => Object.entries(obj || {}).forEach(([key, value]) => {
    if (["_meta", "sources", "layers", "module_icon", "ingredients", "count_template"].includes(key)) return;
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      applyObject(value, path);
      return;
    }
    if (applyLink(key, value)) return;
    const ids = specialIds(path) || [key];
    const allowHtml = ids.some(id => ["how_confirmed", "how_ambiguous"].includes(id));
    for (const id of ids) {
      if (setText(id, value, allowHtml)) break;
    }
  });

  const applyMeta = data => {
    if (data.title) {
      const pageTitle = data.page_title || `BOTIA — ${data.title}`;
      document.title = pageTitle;
      document.querySelector('meta[property="og:title"]')?.setAttribute("content", pageTitle);
      document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", pageTitle);
    }
    const description = data.description || data.what_is;
    if (description) {
      document.querySelector('meta[name="description"]')?.setAttribute("content", description);
      document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
      document.querySelector('meta[name="twitter:description"]')?.setAttribute("content", description);
    }
  };

  const applyCollections = (data, lang) => {
    const icon = document.getElementById("module_icon");
    if (icon && data.module_icon) icon.src = `/botia/assets/${data.module_icon}`;

    const layers = document.getElementById("layers_container");
    if (layers && Array.isArray(data.layers)) {
      layers.replaceChildren(...data.layers.map(layer => {
        const route = LAYER_ROUTES[layer];
        const badge = document.createElement(route ? "a" : "span");
        badge.className = `layer-badge layer-${layer}`;
        badge.textContent =
          LAYER_LABELS[lang]?.[layer] ||
          LAYER_LABELS.en[layer] ||
          layer;
        if (route) {
          const href = new URL(route, location.origin);
          href.searchParams.set("lang", lang);
          badge.href = href.toString();
          badge.setAttribute("aria-label", `${layer}: BOTIA`);
        }
        return badge;
      }));
    }

    const sources = document.getElementById("sources_container");
    if (sources && Array.isArray(data.sources)) {
      sources.replaceChildren(...data.sources.map(source => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = source.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = source.label;
        li.appendChild(a);
        return li;
      }));
    }
  };

  const interpolate = (template, values) => String(template || "").replace(/\{(\w+)\}/g, (match, key) =>
    Object.prototype.hasOwnProperty.call(values, key) ? String(values[key]) : match
  );

  const renderIngredientIndex = (data, lang) => {
    const list = document.getElementById("ingredient-list");
    if (!list || !Array.isArray(data.ingredients)) return;

    const search = document.getElementById("search");
    const count = document.getElementById("count");
    const noResults = document.getElementById("no-results");
    const total = data.ingredients.length;
    const countTemplate = data.count_template || "{visible} of {total}";

    if (noResults && data.no_results) noResults.textContent = data.no_results;

    if (search) {
      if (data.search_placeholder) search.placeholder = data.search_placeholder;
      search.setAttribute("aria-label", data.search_aria_label || data.search_placeholder || "Search ingredients");
    }

    // Ordenar los ingredientes según el idioma actual
    const sorted = [...data.ingredients].sort((a, b) =>
      String(a.name || "").localeCompare(String(b.name || ""), lang)
    );
    const cards = sorted.map(item => {
      const card = document.createElement("article");
      card.className = "ingredient-card";
      card.dataset.search = [item.name, item.e_code, item.aliases]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase(lang);

      const main = document.createElement("a");
      main.className = "ingredient-card-main";
      const ingredientHref = new URL(`/ingredients/${item.slug}.html`, location.origin);
      ingredientHref.searchParams.set("lang", lang);
      main.href = ingredientHref.toString();
      main.setAttribute("aria-label", [item.name, item.e_code].filter(Boolean).join(" — "));

      const top = document.createElement("div");
      top.className = "ingredient-card-top";

      const name = document.createElement("span");
      name.className = "ingredient-card-name";
      name.textContent = item.name;
      top.appendChild(name);

      if (item.e_code) {
        const ecode = document.createElement("span");
        ecode.className = "ingredient-card-ecode";
        ecode.textContent = item.e_code;
        top.appendChild(ecode);
      }

      main.appendChild(top);
      card.appendChild(main);

      if (Array.isArray(item.layers) && item.layers.length) {
        const layers = document.createElement("div");
        layers.className = "ingredient-card-layers";

        item.layers.forEach(layer => {
          const route = LAYER_ROUTES[layer];
          const badge = document.createElement(route ? "a" : "span");
          badge.className = `layer-badge layer-${layer}`;
          badge.textContent =
            LAYER_LABELS[lang]?.[layer] ||
            LAYER_LABELS.en[layer] ||
            layer;
          if (route) {
            const layerHref = new URL(route, location.origin);
            layerHref.searchParams.set("lang", lang);
            badge.href = layerHref.toString();
            badge.setAttribute("aria-label", `${layer}: BOTIA`);
          }
          layers.appendChild(badge);
        });
        card.appendChild(layers);
      }

      return card;
    });

    list.replaceChildren(...cards);

    const update = () => {
      const query = String(search?.value || "").trim().toLocaleLowerCase(lang);
      let visible = 0;
      cards.forEach(card => {
        const matches = !query || card.dataset.search.includes(query);
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      if (count) count.textContent = interpolate(countTemplate, { visible, total });
      if (noResults) noResults.hidden = visible !== 0;
    };

    if (search) search.oninput = update;
    update();
  };

  const applyWebViewLabels = lang => {
    const ui = UI_TEXT[lang] || UI_TEXT.en;
    setText("label_detected", ui.detected);
    setText("label_matters", ui.matters);
    setText("label_cannot", ui.cannot);
    setText("label_sources", ui.sources);
    setText("label_note", ui.note);
    setText("botia_disclaimer", ui.disclaimer);
  };

  const applyGlobalLabels = lang => {
    const ui = UI_TEXT[lang] || UI_TEXT.en;
    const nav = NAV_TEXT[lang] || NAV_TEXT.en;
    setText("what_is_title", ui.what_is);
    setText("why_botia_title", ui.why_botia);
    setText("can_title", ui.can);
    setText("cannot_title", ui.cannot_do);
    setText("sources_title", ui.sources_title);
    setText("back-button", ui.back);
    setText("sources-label", nav.sources);
    setText("back-to-botia", nav.back_to_botia);
    setText("back-to-evidence", nav.back_to_evidence);
    document.querySelectorAll(".skip-link").forEach(link => { link.textContent = nav.skip; });

    const select = document.getElementById("lang-select");
    if (select) select.setAttribute("aria-label", ui.select_language);
    const label = document.querySelector('label[for="lang-select"]');
    if (label) label.textContent = ui.select_language;
  };

  const preserveLanguageInInternalLinks = lang => {
    document.querySelectorAll('a[href]').forEach(anchor => {
      const raw = anchor.getAttribute('href');
      if (!raw || raw.startsWith('#') || raw.startsWith('mailto:') || raw.startsWith('tel:')) return;
      let url;
      try { url = new URL(raw, location.href); } catch (_) { return; }
      if (url.origin !== location.origin) return;
      url.searchParams.set('lang', lang);
      anchor.href = url.toString();
    });
  };

  const triggerItems = () => {
    const trigger = new URLSearchParams(location.search).get("trigger");
    return String(trigger || "").split(",").map(item => item.trim()).filter(Boolean);
  };

  const displayTriggerName = item => String(item || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, char => char.toUpperCase());

  const renderHeaderTrigger = lang => {
    const container = document.getElementById("header_trigger_container");
    if (!container) return;
    container.replaceChildren();

    const items = triggerItems();
    if (!items.length) return;

    const ui = UI_TEXT[lang] || UI_TEXT.en;

    const caption = document.createElement("div");
    caption.className = "botia-trigger-caption";
    caption.textContent = ui.detected;
    container.appendChild(caption);

    const wrapper = document.createElement("div");
    wrapper.className = "botia-header-trigger";

    items.forEach(item => {
      const slug = ingredientSlug(item);
      if (!slug) return;

      const fallbackLabel = displayTriggerName(item);
      const link = document.createElement("a");
      link.className = "botia-trigger-link";
      link.href = `/ingredients/${slug}.html?lang=${encodeURIComponent(lang)}`;
      link.textContent = fallbackLabel;
      link.setAttribute("aria-label", `${ui.more_info} ${fallbackLabel}`);
      wrapper.appendChild(link);

      fetch(`/i18n/${encodeURIComponent(lang)}/${slug}.json`)
        .then(response => {
          if (!response.ok) throw new Error(`Ingredient i18n ${response.status}`);
          return response.json();
        })
        .then(data => {
          const localName = String(data.name || data.title || fallbackLabel).trim();
          const eCode = String(data.e_code || "").trim();
          const visibleLabel = eCode && !localName.includes(eCode)
            ? `${localName} · ${eCode}`
            : localName;

          link.textContent = visibleLabel;
          link.setAttribute("aria-label", `${ui.more_info} ${visibleLabel}`);
        })
        .catch(() => {
          // Safe fallback: keep the readable slug label if translation is unavailable.
        });
    });

    if (wrapper.children.length) {
      container.appendChild(wrapper);
    }
  };

  const ingredientSlug = item => item
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "");

  const renderIngredientLinks = lang => {
    const container = document.getElementById("ingredient_link_container");
    if (!container) return;
    container.replaceChildren();
    const items = triggerItems();
    if (!items.length) return;

    const ui = UI_TEXT[lang] || UI_TEXT.en;
    const ul = document.createElement("ul");
    ul.className = "botia-trigger-list";
    items.forEach(item => {
      const slug = ingredientSlug(item);
      if (!slug) return;
      const a = document.createElement("a");
      a.href = `/ingredients/${slug}.html?lang=${encodeURIComponent(lang)}`;
      a.textContent = `${ui.more_info} ${item}`;
      a.target = "_blank";
      a.rel = "noopener";
      const li = document.createElement("li");
      li.appendChild(a);
      ul.appendChild(li);
    });
    if (ul.children.length) container.appendChild(ul);
  };

  const fetchJson = async (module, lang) => {
    const response = await fetch(`/i18n/${lang}/${module}.json`);
    if (!response.ok) throw new Error(`${response.status} /i18n/${lang}/${module}.json`);
    return response.json();
  };

  const loadModule = async (module, requested) => {
    requested = normalise(requested);
    storeLanguage(requested);
    document.documentElement.lang = requested;
    document.documentElement.dir = RTL.has(requested) ? "rtl" : "ltr";
    document.body.dir = RTL.has(requested) ? "rtl" : "ltr";
    const select = document.getElementById("lang-select");
    if (select) select.value = requested;

    applyWebViewLabels(requested);
    applyGlobalLabels(requested);
    renderHeaderTrigger(requested);
    renderIngredientLinks(requested);

    let data;
    let loaded = requested;
    try {
      data = await fetchJson(module, requested);
    } catch (error) {
      if (requested === "en") {
        console.error("BOTIA i18n:", error);
        return false;
      }
      console.warn(`BOTIA i18n fallback: ${requested} -> en for ${module}`);
      loaded = "en";
      try {
        data = await fetchJson(module, "en");
      } catch (fallbackError) {
        console.error("BOTIA i18n:", fallbackError);
        return false;
      }
    }

    document.documentElement.dataset.botiaTranslation = loaded;
    if (loaded !== requested) {
      document.documentElement.lang = loaded;
      document.documentElement.dir = RTL.has(loaded) ? "rtl" : "ltr";
      document.body.dir = RTL.has(loaded) ? "rtl" : "ltr";
      applyWebViewLabels(loaded);
      applyGlobalLabels(loaded);
      renderHeaderTrigger(loaded);
      renderIngredientLinks(loaded);
    }

    applyMeta(data);
    applyObject(data);
    applyCollections(data, loaded);
    renderIngredientIndex(data, loaded);
    preserveLanguageInInternalLinks(loaded);
    return true;
  };

  const init = () => {
    if (runtime.initPromise) return runtime.initPromise;

    runtime.initPromise = (async () => {
      const ok = await loadModule(moduleName(), language());
      const back = document.getElementById("back-button");
      if (back && !back.dataset.botiaBackBound) {
        back.dataset.botiaBackBound = "true";
        back.addEventListener("click", event => {
          if (document.referrer && document.referrer.includes(location.hostname)) {
            event.preventDefault();
            history.back();
          }
        });
      }
      return ok;
    })();

    return runtime.initPromise;
  };

  // Backwards-compatible API for the three app WebViews and any external caller.
  const loadTranslations = (_product, ingredientCode, lang) => loadModule(ingredientCode, lang);
  window.BOTIA = {
    init,
    language,
    normalise,
    detectLanguage: language,
    loadTranslations
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
