La suscripción a Google One se cancelará … Actualiza tu método de pago para el 2 jun 2026 para renovar tu suscripción de almacenamiento
1
100 %
# BOTIA — Module: halal/
### Halal / Haram / Mashbooh Classification

**Owner:** Paloma García / ServiceHub  
**Status:** ✅ Active — Phase 1  
**Last updated:** 2026-05-30

---

## What this module does

This module displays ingredient information cards for Halal food classification.

When the BOTIA backend detects a flagged ingredient, FlutterFlow opens a WebView
pointing to one of the three cards in this module, passing the specific ingredient
code and the user's language as URL parameters.

---

## Cards in this module

| File | Decision | Description |
|------|----------|-------------|
| `halal.html` | H | Product is clearly Halal |
| `haram.html` | R | Product contains Haram ingredient |
| `doubt.html` | M | Product contains doubtful ingredient (Mashbooh) |

---

## URL pattern

```
/botia/halal/halal.html?ingredient=halal_clear&lang=es
/botia/halal/haram.html?ingredient=alcohol&lang=en
/botia/halal/doubt.html?ingredient=e471&lang=nl
```

---

## Ingredients covered

### HARAM (haram.html)
| Code | Description |
|------|-------------|
| `pork_gelatin` | Pork and pork derivatives |
| `alcohol` | Alcohol visible on label |
| `carmine_e120` | Insect-derived colorant (E120) |

### MASHBOOH / DOUBT (doubt.html)
| Code | Description |
|------|-------------|
| `e471` | Mono- and diglycerides of fatty acids |
| `e481` | Sodium stearoyl-2-lactylate |
| `e482` | Calcium stearoyl-2-lactylate |
| `e472` | Esters of fatty acids (various) |
| `e475` | Polyglycerol esters of fatty acids |
| `natural_aroma` | Natural flavourings (unknown origin) |
| `cheese_rennet` | Cheese with unspecified rennet |
| `enzymes` | Enzymes (unknown origin) |
| `gelatin` | Gelatin (unknown origin) |
| `whey_powder` | Whey powder (may contain animal enzymes) |
| `lactic_acid` | Lactic acid (plant or animal origin) |

### HALAL (halal.html)
| Code | Description |
|------|-------------|
| `halal_clear` | No flagged ingredients detected |

---

## Languages

Currently active: `en` `es`  
Planned: `nl` `ar` `de` `fr` `it` `pt` `pl`

---

## How to add a new ingredient

1. Open `i18n/en.json`
2. Add entry with ingredient code as key (use existing entries as template)
3. Fill all content fields
4. Repeat for `es.json`
5. Validate JSON at jsonlint.com
6. Commit: `"Add [ingredient_code] to halal module"`

The HTML does not need to change. The i18n loader handles everything.

---

## How to add a new language

1. Copy `i18n/en.json`
2. Rename to `i18n/[lang_code].json`
3. Translate all content fields
4. Commit: `"Add [language] translations to halal module"`

---

## Backend integration

FlutterFlow receives from backend:
```json
{
  "decision": "R",
  "ingredient": "alcohol",
  "lang": "es",
  "woman": "alert_endocrine"
}
```

FlutterFlow constructs URL:
```
IF decision = "R":
  URL = "https://botia-safefood.com/botia/halal/haram.html"
      + "?ingredient=" + ingredient
      + "&lang=" + lang
```

---

*Part of BOTIA — Safe Food Choice*  
*www.botia-safefood.com*
