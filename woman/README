# BOTIA — Module: woman/
### Women's Health Context Layer

**Owner:** Paloma García / ServiceHub  
**Status:** 🔄 In progress — Phase 1  
**Last updated:** 2026-05-30

---

## What this module does

This module is BOTIA's signature layer.

It provides continuous women's health context for every product scan —
not just when a specific dangerous ingredient is detected, but always,
because there is always relevant context for women's health in food.

This is not a "special cases" module (pregnancy, breastfeeding).
It is education for every woman, from birth to death.

---

## Why this module exists

Food safety research has historically been calibrated for male bodies.
Safety thresholds, clinical reference values, and toxicology studies
were designed with men as the default norm.

What this means in practice:
- Endocrine disruptors affect women differentially due to hormonal
  sensitivity and higher lipid accumulation.
- Packaging migrants (BPA, phthalates, PFAS) don't appear on ingredient
  lists — but they accumulate in fatty tissue.
- When losing weight rapidly, years of stored fat-soluble toxins
  release into the bloodstream — causing symptoms often misread
  as "lack of willpower."
- The cumulative, long-term effects of common additives on hormonal
  health are systematically under-researched and under-reported.

BOTIA's woman layer makes this visible.
Because 52% of humanity deserves to know.

---

## Two alert modes

### Mode 1 — Specific ingredient with female health risk
Backend returns a specific ingredient code:
```
woman = "bpa" | "parabens_e214" | "e171" | "pfas" | ...
```
WebView opens the specific card for that endocrine disruptor.

### Mode 2 — General context alert (no specific ingredient)
Backend returns a general alert category:
```
woman = "alert_fat_accumulation"
woman = "alert_endocrine"
woman = "alert_packaging"
woman = "alert_hormonal_cycle"
```
WebView opens a general context card for that category.

Examples of Mode 2 content:
- Rapid weight loss → stored fat-soluble toxins release into bloodstream
- High-fat product in plastic packaging → endocrine disruptor migration risk
- Product with multiple E-number additives → cumulative hormonal load

---

## Ingredients and alerts covered

### Specific ingredients (Mode 1)
| Code | Description |
|------|-------------|
| `bpa` | Bisphenol A — packaging migrant, endocrine disruptor |
| `parabens_e214` | Parabens (E214-E219) — preservatives, hormonal activity |
| `e171` | Titanium dioxide — nanoparticles, reproductive concerns |
| `pfas` | PFAS — non-stick coatings, persistent organic pollutants |
| `phthalates` | Phthalates — plasticisers, hormonal disruption |

### General alerts (Mode 2)
| Code | Description |
|------|-------------|
| `alert_fat_accumulation` | Fat-soluble toxin accumulation and release |
| `alert_endocrine` | General endocrine disruptor exposure |
| `alert_packaging` | Packaging migrant risk |
| `alert_hormonal_cycle` | Additives affecting hormonal cycle |

---

## URL pattern

```
/botia/woman/woman.html?ingredient=bpa&lang=es
/botia/woman/woman.html?ingredient=alert_fat_accumulation&lang=en
```

---

## Languages

Currently active: `en` `es`  
Planned: `nl` `ar` `de` `fr` `it` `pt` `pl`

---

## Important: this module is always active

Unlike other modules that depend on the user's profile (halal for Muslim users,
vegan for vegan users), the woman module is active for all users.

Every scan returns a `woman` field. Always.

---

## Backend integration

FlutterFlow receives:
```json
{
  "decision": "M",
  "ingredient": "e471",
  "lang": "es",
  "woman": "alert_endocrine"
}
```

Woman icon is always shown. When tapped:
```
URL = "https://botia-safefood.com/botia/woman/woman.html"
    + "?ingredient=" + woman
    + "&lang=" + lang
```

---

*Part of BOTIA — Safe Food Choice*  
*www.botia-safefood.com*  
*Because 52% of humanity deserves to know what they're eating.*
