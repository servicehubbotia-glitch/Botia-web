// BOTIA — Nutrition Facts renderer v4.
// Dynamic nutrient labels are shown in the BOTIA UI language.
// The original OCR label is preserved in the payload and is never overwritten.
(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const storedLang = (() => {
    try { return localStorage.getItem("botia-lang") || ""; } catch (_) { return ""; }
  })();
  const lang = String(
    params.get("lang") ||
    storedLang ||
    document.documentElement.lang ||
    navigator.language ||
    "en"
  ).trim().toLowerCase().split("-", 1)[0];

  const el = id => document.getElementById(id);

  const NUTRIENT_LABELS = {
    en: {
      energy_kj: "Energy", energy_kcal: "Energy", fat: "Total fat",
      saturated_fat: "Saturated fat", trans_fat: "Trans fat",
      carbohydrate: "Carbohydrate", total_sugars: "Total sugars",
      added_sugars: "Added sugars", free_sugars: "Free sugars",
      fibre: "Fibre", protein: "Protein", salt: "Salt", sodium: "Sodium",
      cholesterol: "Cholesterol", potassium: "Potassium", calcium: "Calcium",
      iron: "Iron", vitamin_d: "Vitamin D"
    },
    es: {
      energy_kj: "Energía", energy_kcal: "Energía", fat: "Grasas totales",
      saturated_fat: "Grasas saturadas", trans_fat: "Grasas trans",
      carbohydrate: "Hidratos de carbono", total_sugars: "Azúcares totales",
      added_sugars: "Azúcares añadidos", free_sugars: "Azúcares libres",
      fibre: "Fibra", protein: "Proteínas", salt: "Sal", sodium: "Sodio",
      cholesterol: "Colesterol", potassium: "Potasio", calcium: "Calcio",
      iron: "Hierro", vitamin_d: "Vitamina D"
    },
    ar: {
      energy_kj: "الطاقة", energy_kcal: "الطاقة", fat: "الدهون الكلية",
      saturated_fat: "الدهون المشبعة", trans_fat: "الدهون المتحولة",
      carbohydrate: "الكربوهيدرات", total_sugars: "السكريات الكلية",
      added_sugars: "السكريات المضافة", free_sugars: "السكريات الحرة",
      fibre: "الألياف", protein: "البروتين", salt: "الملح", sodium: "الصوديوم",
      cholesterol: "الكوليسترول", potassium: "البوتاسيوم", calcium: "الكالسيوم",
      iron: "الحديد", vitamin_d: "فيتامين د"
    },
    de: {
      energy_kj: "Energie", energy_kcal: "Energie", fat: "Fett",
      saturated_fat: "Gesättigte Fettsäuren", trans_fat: "Transfette",
      carbohydrate: "Kohlenhydrate", total_sugars: "Zucker gesamt",
      added_sugars: "Zugesetzter Zucker", free_sugars: "Freie Zucker",
      fibre: "Ballaststoffe", protein: "Eiweiß", salt: "Salz", sodium: "Natrium",
      cholesterol: "Cholesterin", potassium: "Kalium", calcium: "Calcium",
      iron: "Eisen", vitamin_d: "Vitamin D"
    },
    fr: {
      energy_kj: "Énergie", energy_kcal: "Énergie", fat: "Matières grasses",
      saturated_fat: "Acides gras saturés", trans_fat: "Acides gras trans",
      carbohydrate: "Glucides", total_sugars: "Sucres totaux",
      added_sugars: "Sucres ajoutés", free_sugars: "Sucres libres",
      fibre: "Fibres", protein: "Protéines", salt: "Sel", sodium: "Sodium",
      cholesterol: "Cholestérol", potassium: "Potassium", calcium: "Calcium",
      iron: "Fer", vitamin_d: "Vitamine D"
    },
    id: {
      energy_kj: "Energi", energy_kcal: "Energi", fat: "Lemak total",
      saturated_fat: "Lemak jenuh", trans_fat: "Lemak trans",
      carbohydrate: "Karbohidrat", total_sugars: "Gula total",
      added_sugars: "Gula tambahan", free_sugars: "Gula bebas",
      fibre: "Serat pangan", protein: "Protein", salt: "Garam", sodium: "Natrium",
      cholesterol: "Kolesterol", potassium: "Kalium", calcium: "Kalsium",
      iron: "Zat besi", vitamin_d: "Vitamin D"
    },
    it: {
      energy_kj: "Energia", energy_kcal: "Energia", fat: "Grassi totali",
      saturated_fat: "Grassi saturi", trans_fat: "Grassi trans",
      carbohydrate: "Carboidrati", total_sugars: "Zuccheri totali",
      added_sugars: "Zuccheri aggiunti", free_sugars: "Zuccheri liberi",
      fibre: "Fibre", protein: "Proteine", salt: "Sale", sodium: "Sodio",
      cholesterol: "Colesterolo", potassium: "Potassio", calcium: "Calcio",
      iron: "Ferro", vitamin_d: "Vitamina D"
    },
    nl: {
      energy_kj: "Energie", energy_kcal: "Energie", fat: "Totaal vet",
      saturated_fat: "Verzadigd vet", trans_fat: "Transvet",
      carbohydrate: "Koolhydraten", total_sugars: "Totale suikers",
      added_sugars: "Toegevoegde suikers", free_sugars: "Vrije suikers",
      fibre: "Vezels", protein: "Eiwitten", salt: "Zout", sodium: "Natrium",
      cholesterol: "Cholesterol", potassium: "Kalium", calcium: "Calcium",
      iron: "IJzer", vitamin_d: "Vitamine D"
    },
    pl: {
      energy_kj: "Wartość energetyczna", energy_kcal: "Wartość energetyczna",
      fat: "Tłuszcz", saturated_fat: "Kwasy tłuszczowe nasycone",
      trans_fat: "Tłuszcze trans", carbohydrate: "Węglowodany",
      total_sugars: "Cukry ogółem", added_sugars: "Cukry dodane",
      free_sugars: "Cukry wolne", fibre: "Błonnik", protein: "Białko",
      salt: "Sól", sodium: "Sód", cholesterol: "Cholesterol",
      potassium: "Potas", calcium: "Wapń", iron: "Żelazo", vitamin_d: "Witamina D"
    },
    pt: {
      energy_kj: "Energia", energy_kcal: "Energia", fat: "Gorduras totais",
      saturated_fat: "Gorduras saturadas", trans_fat: "Gorduras trans",
      carbohydrate: "Hidratos de carbono", total_sugars: "Açúcares totais",
      added_sugars: "Açúcares adicionados", free_sugars: "Açúcares livres",
      fibre: "Fibra", protein: "Proteínas", salt: "Sal", sodium: "Sódio",
      cholesterol: "Colesterol", potassium: "Potássio", calcium: "Cálcio",
      iron: "Ferro", vitamin_d: "Vitamina D"
    },
    ro: {
      energy_kj: "Energie", energy_kcal: "Energie", fat: "Grăsimi totale",
      saturated_fat: "Grăsimi saturate", trans_fat: "Grăsimi trans",
      carbohydrate: "Carbohidrați", total_sugars: "Zaharuri totale",
      added_sugars: "Zaharuri adăugate", free_sugars: "Zaharuri libere",
      fibre: "Fibre", protein: "Proteine", salt: "Sare", sodium: "Sodiu",
      cholesterol: "Colesterol", potassium: "Potasiu", calcium: "Calciu",
      iron: "Fier", vitamin_d: "Vitamina D"
    },
    ru: {
      energy_kj: "Энергетическая ценность", energy_kcal: "Энергетическая ценность",
      fat: "Жиры", saturated_fat: "Насыщенные жиры", trans_fat: "Трансжиры",
      carbohydrate: "Углеводы", total_sugars: "Сахара всего",
      added_sugars: "Добавленные сахара", free_sugars: "Свободные сахара",
      fibre: "Пищевые волокна", protein: "Белки", salt: "Соль", sodium: "Натрий",
      cholesterol: "Холестерин", potassium: "Калий", calcium: "Кальций",
      iron: "Железо", vitamin_d: "Витамин D"
    },
    tr: {
      energy_kj: "Enerji", energy_kcal: "Enerji", fat: "Toplam yağ",
      saturated_fat: "Doymuş yağ", trans_fat: "Trans yağ",
      carbohydrate: "Karbonhidrat", total_sugars: "Toplam şeker",
      added_sugars: "İlave şeker", free_sugars: "Serbest şeker",
      fibre: "Lif", protein: "Protein", salt: "Tuz", sodium: "Sodyum",
      cholesterol: "Kolesterol", potassium: "Potasyum", calcium: "Kalsiyum",
      iron: "Demir", vitamin_d: "D vitamini"
    },
    zh: {
      energy_kj: "能量", energy_kcal: "能量", fat: "总脂肪",
      saturated_fat: "饱和脂肪", trans_fat: "反式脂肪",
      carbohydrate: "碳水化合物", total_sugars: "总糖",
      added_sugars: "添加糖", free_sugars: "游离糖",
      fibre: "膳食纤维", protein: "蛋白质", salt: "盐", sodium: "钠",
      cholesterol: "胆固醇", potassium: "钾", calcium: "钙",
      iron: "铁", vitamin_d: "维生素D"
    }
  };

  const KEY_ALIASES = {
    fat_total_g: "fat", fat_saturated_g: "saturated_fat", fat_trans_g: "trans_fat",
    carbohydrate_g: "carbohydrate", sugars_total_g: "total_sugars",
    sugars_added_g: "added_sugars", sugars_free_g: "free_sugars",
    fibre_g: "fibre", fiber_g: "fibre", protein_g: "protein",
    salt_g: "salt", sodium_mg: "sodium", cholesterol_mg: "cholesterol",
    potassium_mg: "potassium", calcium_mg: "calcium", iron_mg: "iron",
    vitamin_d_ug: "vitamin_d"
  };

  const normaliseLabel = value => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[()[\]:;,%]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const LABEL_ALIASES = {
    // Dutch
    "vet":"fat","vetten":"fat","totaal vet":"fat",
    "verzadigd vet":"saturated_fat","verzadigde vetzuren":"saturated_fat",
    "waarvan verzadigde vetzuren":"saturated_fat","transvet":"trans_fat",
    "transvetten":"trans_fat","koolhydraten":"carbohydrate",
    "waarvan suikers":"total_sugars","suikers":"total_sugars",
    "toegevoegde suikers":"added_sugars","vrije suikers":"free_sugars",
    "vezels":"fibre","voedingsvezels":"fibre","eiwitten":"protein",
    "zout":"salt","natrium":"sodium","energie":"__energy__",

    // English
    "total fat":"fat","fat":"fat","saturated fat":"saturated_fat",
    "saturates":"saturated_fat","trans fat":"trans_fat",
    "carbohydrate":"carbohydrate","total carbohydrate":"carbohydrate",
    "total sugars":"total_sugars","sugars":"total_sugars",
    "added sugars":"added_sugars","free sugars":"free_sugars",
    "dietary fibre":"fibre","dietary fiber":"fibre","fibre":"fibre","fiber":"fibre",
    "protein":"protein","salt":"salt","sodium":"sodium","energy":"__energy__",

    // Spanish
    "grasas":"fat","grasas totales":"fat","grasa total":"fat",
    "grasas saturadas":"saturated_fat","acidos grasos saturados":"saturated_fat",
    "grasas trans":"trans_fat","hidratos de carbono":"carbohydrate",
    "carbohidratos":"carbohydrate","azucares":"total_sugars",
    "azucares totales":"total_sugars","de los cuales azucares":"total_sugars",
    "azucares anadidos":"added_sugars","azucares libres":"free_sugars",
    "fibra":"fibre","fibra alimentaria":"fibre","proteinas":"protein",
    "sal":"salt","sodio":"sodium","energia":"__energy__",

    // French
    "matieres grasses":"fat","lipides":"fat","acides gras satures":"saturated_fat",
    "dont acides gras satures":"saturated_fat","acides gras trans":"trans_fat",
    "glucides":"carbohydrate","sucres":"total_sugars","dont sucres":"total_sugars",
    "sucres totaux":"total_sugars","sucres ajoutes":"added_sugars",
    "sucres libres":"free_sugars","fibres":"fibre","fibres alimentaires":"fibre",
    "proteines":"protein","sel":"salt","sodium":"sodium","energie":"__energy__",

    // German
    "fett":"fat","gesamtfett":"fat","gesattigte fettsauren":"saturated_fat",
    "davon gesattigte fettsauren":"saturated_fat","transfette":"trans_fat",
    "kohlenhydrate":"carbohydrate","zucker":"total_sugars","davon zucker":"total_sugars",
    "zugesetzter zucker":"added_sugars","freie zucker":"free_sugars",
    "ballaststoffe":"fibre","eiweiss":"protein","salz":"salt","natrium":"sodium",
    "energie":"__energy__",

    // Italian / Portuguese / Polish / Romanian / Turkish / Indonesian / Russian
    "grassi":"fat","grassi totali":"fat","grassi saturi":"saturated_fat",
    "carboidrati":"carbohydrate","zuccheri":"total_sugars","di cui zuccheri":"total_sugars",
    "proteine":"protein","sale":"salt",
    "gorduras totais":"fat","gorduras saturadas":"saturated_fat",
    "carboidratos":"carbohydrate","acucares totais":"total_sugars",
    "acucares adicionados":"added_sugars","fibra alimentar":"fibre",
    "proteinas":"protein","sodio":"sodium",
    "tluszcz":"fat","kwasy tluszczowe nasycone":"saturated_fat",
    "weglowodany":"carbohydrate","cukry":"total_sugars","w tym cukry":"total_sugars",
    "bialko":"protein","sol":"salt","sod":"sodium",
    "grasimi":"fat","grasimi totale":"fat","grasimi saturate":"saturated_fat",
    "carbohidrati":"carbohydrate","zaharuri":"total_sugars","proteine":"protein",
    "sare":"salt","sodiu":"sodium",
    "toplam yag":"fat","doymus yag":"saturated_fat","karbonhidrat":"carbohydrate",
    "toplam seker":"total_sugars","ilave seker":"added_sugars","lif":"fibre",
    "tuz":"salt","sodyum":"sodium","enerji":"__energy__",
    "lemak total":"fat","lemak jenuh":"saturated_fat","karbohidrat total":"carbohydrate",
    "gula total":"total_sugars","gula tambahan":"added_sugars","serat pangan":"fibre",
    "garam":"salt","natrium":"sodium","energi":"__energy__",
    "жиры":"fat","насыщенные жиры":"saturated_fat","углеводы":"carbohydrate",
    "сахара всего":"total_sugars","добавленные сахара":"added_sugars",
    "пищевые волокна":"fibre","белки":"protein","соль":"salt","натрий":"sodium",

    // Chinese / Arabic
    "脂肪":"fat","总脂肪":"fat","饱和脂肪":"saturated_fat","反式脂肪":"trans_fat",
    "碳水化合物":"carbohydrate","糖":"total_sugars","总糖":"total_sugars",
    "添加糖":"added_sugars","游离糖":"free_sugars","膳食纤维":"fibre",
    "蛋白质":"protein","盐":"salt","钠":"sodium","能量":"__energy__",
    "الدهون":"fat","الدهون الكلية":"fat","الدهون المشبعة":"saturated_fat",
    "الدهون المتحولة":"trans_fat","الكربوهيدرات":"carbohydrate",
    "السكريات":"total_sugars","السكريات الكلية":"total_sugars",
    "السكريات المضافة":"added_sugars","السكريات الحرة":"free_sugars",
    "الألياف":"fibre","البروتين":"protein","الملح":"salt","الصوديوم":"sodium",
    "الطاقة":"__energy__"
  };

  const canonicalNutrientKey = item => {
    const rawKey = String(item?.key || item?.nutrient || "").trim();
    const direct = KEY_ALIASES[rawKey] || rawKey;
    const table = NUTRIENT_LABELS[lang] || NUTRIENT_LABELS.en;
    if (table[direct]) return direct;

    const alias = LABEL_ALIASES[normaliseLabel(item?.label)];
    if (alias === "__energy__") {
      const unit = String(item?.unit || "").trim().toLowerCase();
      if (unit === "kj") return "energy_kj";
      if (unit === "kcal" || unit === "cal") return "energy_kcal";
    }
    return alias || direct;
  };

  const BASIS_LABELS = {
    en: {per_100g:"per 100 g", per_100ml:"per 100 ml", per_serving:"per serving"},
    es: {per_100g:"por 100 g", per_100ml:"por 100 ml", per_serving:"por porción"},
    ar: {per_100g:"لكل 100 غ", per_100ml:"لكل 100 مل", per_serving:"لكل حصة"},
    de: {per_100g:"pro 100 g", per_100ml:"pro 100 ml", per_serving:"pro Portion"},
    fr: {per_100g:"pour 100 g", per_100ml:"pour 100 ml", per_serving:"par portion"},
    id: {per_100g:"per 100 g", per_100ml:"per 100 ml", per_serving:"per sajian"},
    it: {per_100g:"per 100 g", per_100ml:"per 100 ml", per_serving:"per porzione"},
    nl: {per_100g:"per 100 g", per_100ml:"per 100 ml", per_serving:"per portie"},
    pl: {per_100g:"na 100 g", per_100ml:"na 100 ml", per_serving:"na porcję"},
    pt: {per_100g:"por 100 g", per_100ml:"por 100 ml", per_serving:"por porção"},
    ro: {per_100g:"per 100 g", per_100ml:"per 100 ml", per_serving:"per porție"},
    ru: {per_100g:"на 100 г", per_100ml:"на 100 мл", per_serving:"на порцию"},
    tr: {per_100g:"100 g için", per_100ml:"100 ml için", per_serving:"porsiyon başına"},
    zh: {per_100g:"每100克", per_100ml:"每100毫升", per_serving:"每份"}
  };

  const safeJson = raw => {
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (_) {}
    try {
      let b64 = String(raw).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      const bytes = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    } catch (_) {
      return null;
    }
  };

  const unwrap = raw => {
    if (!raw || typeof raw !== "object") return null;
    if (raw.web_payload && typeof raw.web_payload === "object") return raw.web_payload;
    if (raw.nutrition?.web_payload && typeof raw.nutrition.web_payload === "object") {
      return raw.nutrition.web_payload;
    }
    if ("declared" in raw || "references" in raw || "basis" in raw) return raw;
    return null;
  };

  const initialPayload = () => {
    const runtime = unwrap(window.BOTIA_NUTRITION_DATA);
    if (runtime) return runtime;
    return unwrap(safeJson(params.get("payload"))) || {basis:"", declared:[], references:[]};
  };

  const clear = () => {
    el("basis").textContent = "—";
    el("declared_rows").replaceChildren();
    el("references").replaceChildren();
    el("declared_card").hidden = false;
    el("declared_empty").hidden = true;
    el("references_empty").hidden = false;
  };

  const displayAmount = row => {
    const parts = [];
    if (row?.value !== undefined && row?.value !== null && String(row.value).trim() !== "") {
      parts.push(String(row.value));
    }
    if (row?.unit !== undefined && row?.unit !== null && String(row.unit).trim() !== "") {
      parts.push(String(row.unit));
    }
    return parts.join(" ") || "—";
  };

  const nutrientLabel = item => {
    const key = canonicalNutrientKey(item);
    const table = NUTRIENT_LABELS[lang] || NUTRIENT_LABELS.en;
    return table[key] || item?.label || key || "";
  };

  const basisLabel = basis => {
    const table = BASIS_LABELS[lang] || BASIS_LABELS.en;
    return table[String(basis || "").trim()] || String(basis || "—");
  };

  const renderDeclared = data => {
    const vals = Array.isArray(data.declared) ? data.declared : [];
    el("declared_empty").hidden = vals.length > 0;
    el("declared_card").hidden = vals.length === 0;

    for (const item of vals) {
      if (!item || typeof item !== "object") continue;

      const row = document.createElement("div");
      row.className = "nutrition-row" + (item.sub ? " sub" : "");

      const nutrient = document.createElement("div");
      nutrient.className = "nutrient";
      nutrient.textContent = nutrientLabel(item);

      const amount = document.createElement("div");
      amount.className = "amount";
      amount.textContent = displayAmount(item);

      row.append(nutrient, amount);
      el("declared_rows").appendChild(row);
    }
  };

  const validHttpUrl = raw => {
    try {
      const url = new URL(raw, location.origin);
      return /^https?:$/.test(url.protocol) ? url : null;
    } catch (_) {
      return null;
    }
  };

  const renderReferences = data => {
    const refs = Array.isArray(data.references) ? data.references : [];
    el("references_empty").hidden = refs.length > 0;

    for (const item of refs) {
      if (!item || typeof item !== "object") continue;

      const card = document.createElement("article");
      card.className = "ref-card";

      const head = document.createElement("div");
      head.className = "ref-head";

      const name = document.createElement("h3");
      name.className = "ref-name";
      name.textContent = nutrientLabel(item) || item.label || "Reference";
      head.appendChild(name);

      if (item.classification) {
        const tag = document.createElement("span");
        tag.className = "class-tag";
        tag.textContent = `Class ${item.classification}`;
        head.appendChild(tag);
      }
      card.appendChild(head);

      if (item.declared) {
        const p = document.createElement("p");
        p.className = "declared";
        p.textContent = item.declared;
        card.appendChild(p);
      }

      const cls = String(item.classification || "").toUpperCase();
      const percent = Number(item.percent);
      const showBar =
        (cls === "A" || cls === "B") &&
        Number.isFinite(percent) &&
        item.show_bar !== false;

      if (showBar) {
        const wrap = document.createElement("div");
        wrap.className = "bar-wrap";

        const track = document.createElement("div");
        track.className = "track";

        const bar = document.createElement("div");
        bar.className = "bar";
        bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
        track.appendChild(bar);

        const meta = document.createElement("div");
        meta.className = "bar-meta";

        const label = document.createElement("span");
        label.textContent = item.bar_label || "";

        const pct = document.createElement("span");
        pct.className = "percent";
        pct.textContent = `${percent}%`;

        meta.append(label, pct);
        wrap.append(track, meta);
        card.appendChild(wrap);
      }

      if (item.reference) {
        const p = document.createElement("p");
        p.className = "reference";
        p.textContent = item.reference;
        card.appendChild(p);
      }

      if (item.equivalent) {
        const p = document.createElement("p");
        p.className = "equivalent";
        p.textContent = item.equivalent;
        card.appendChild(p);
      }

      const url = validHttpUrl(item.url);
      if (url) {
        const link = document.createElement("a");
        link.className = "source";
        link.href = url.toString();
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = item.source || "Official source →";
        card.appendChild(link);
      }

      el("references").appendChild(card);
    }
  };

  const render = raw => {
    const data = unwrap(raw) || {basis:"", declared:[], references:[]};
    clear();
    el("basis").textContent = basisLabel(data.basis);
    renderDeclared(data);
    renderReferences(data);
  };

  const runtimePayload = event => {
    const eventData = unwrap(event?.detail);
    if (eventData) return eventData;
    return unwrap(window.BOTIA_NUTRITION_DATA);
  };

  const onRuntimeData = event => {
    const data = runtimePayload(event);
    if (data) render(data);
  };

  document.addEventListener("botia:nutrition-ready", onRuntimeData);
  document.addEventListener("botia:nutrition-updated", onRuntimeData);

  const init = () => render(initialPayload());

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {once:true});
  } else {
    init();
  }
})();
