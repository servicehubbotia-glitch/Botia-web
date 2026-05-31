La suscripción a Google One se cancelará … Actualiza tu método de pago para el 2 jun 2026 para renovar tu suscripción de almacenamiento
1
100 %
# BOTIA — Safe Food Choice
### WebView Content Engine

**Owner:** Paloma García / ServiceHub  
**Project:** BOTIA (BOIP registered)  
**Web:** www.botia-safefood.com  
**Last updated:** 2026-05-30

---

## What is this?

This repository contains the WebView content engine for the BOTIA mobile app.

BOTIA scans food ingredient labels and classifies them using a deterministic AI engine. When a user taps an alert icon in the app, a WebView opens and displays a detailed information card about the flagged ingredient — in the user's language.

This repo is the content layer: the HTML templates, the translation JSONs, and the shared assets that power those cards.

---

## Architecture

The backend returns 4 fields:

```json
{
  "decision": "H" | "R" | "M",
  "ingredient": "e471" | "alcohol" | "pork_gelatin" | ...,
  "lang": "es" | "en" | "nl" | "ar" | ...,
  "woman": "bpa" | "alert_endocrine" | "alert_fat_accumulation" | ...
}
```

- **decision** → lights up the icon in FlutterFlow (H=halal, R=haram, M=doubt)
- **ingredient** → opens the specific WebView card
- **lang** → renders content in the user's language
- **woman** → always present. Women's health context layer. Never optional.

URL pattern:
```
/botia/[module]/[card].html?ingredient=[code]&lang=[language]
```

Example:
```
/botia/halal/haram.html?ingredient=alcohol&lang=es
/botia/woman/woman.html?ingredient=bpa&lang=en
```

---

## Modules

Each module is fully autonomous. It has its own HTML and its own translation JSONs. Adding a new module never requires touching existing modules.

| Module | Status | Description |
|--------|--------|-------------|
| `halal/` | ✅ Active | Halal / Haram / Mashbooh classification |
| `woman/` | 🔄 In progress | Women's health context — always active |
| `sugar/` | 🔜 Planned | Sugar and refined carbohydrate alerts |
| `vegan/` | 🔜 Planned | Vegan classification |
| `vegetarian/` | 🔜 Planned | Vegetarian classification |
| `kosher/` | 🔜 Planned | Kosher classification |
| `jain/` | 🔜 Planned | Jain classification |
| `children/` | 🔜 Planned | Child health alerts |

---

## The Woman Layer

`woman` is not an optional add-on for special cases (pregnancy, breastfeeding).

It is **continuous women's health education** — from birth to death.

Why it's always active:
- Food safety research has historically been calibrated for male bodies.
- Safety thresholds and reference values were designed with men as the norm.
- Endocrine disruptors affect women differentially due to hormonal sensitivity and lipid accumulation.
- Packaging migrants (BPA, phthalates, PFAS) don't appear on ingredient lists — but they matter.
- Cumulative, long-term effects are exactly what conventional alert systems are designed to ignore.

`woman` captures what other systems don't — because it was designed to ignore it.

This is BOTIA's signature and core differentiator.

---

## Languages

9 languages supported:

| Code | Language |
|------|----------|
| `en` | English |
| `es` | Spanish |
| `nl` | Dutch |
| `ar` | Arabic (RTL) |
| `de` | German |
| `fr` | French |
| `it` | Italian |
| `pt` | Portuguese |
| `pl` | Polish |

---

## How to add a new ingredient

1. Open the relevant module's `i18n/en.json`
2. Add a new entry with the ingredient code as key
3. Fill all content fields (see existing entries as template)
4. Repeat for `es.json` (and other languages)
5. Validate JSON at jsonlint.com
6. Commit: `"Add [ingredient_code] to [module] module"`

No HTML changes needed. The loader handles everything dynamically.

---

## How to add a new module

1. Create folder: `botia/[module]/`
2. Copy `halal/` structure as template
3. Create `[module].html`
4. Create `i18n/en.json` + `es.json`
5. Create `README.md` for the module
6. Add module to FlutterFlow onboarding
7. Commit: `"Add [module] module"`

Nothing else needs to change.

---

## Repository

GitHub: `servicehubbotia-glitch/Botia-web`  
Deployed via GitHub Pages  
DNS via Squarespace → `www.botia-safefood.com`

---

*BOTIA — Radical Food Intelligence.*  
*Because 52% of humanity deserves to know what they're eating.*
