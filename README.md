# BOTIA — Food Label Transparency

**botia-safefood.com**

BOTIA reads food ingredient labels and connects what they declare with published
scientific, regulatory and transparency sources — WHO, EFSA, FDA, IARC, JECFA and
Codex Alimentarius. It explains what a label says, what it does not say, and what
cannot be concluded from it.

Operated by ServiceHub (Tilburg, Netherlands). Available in 14 languages.

**BOTIA does not certify food. It does not give medical, nutritional or religious
advice. It does not tell anyone what to eat.** Where the evidence is contested or
under review, BOTIA says so.

---

## The four layers

Content is organised in two families that must not be mixed.

**Evidence layers** signal documented scientific or regulatory concern:
`sugar` · `sweetener` · `texture` · `flavour` · `enumbers`

**Choice layers** support personal, ethical or religious decisions:
`animal` · `muslim` · `woman`

The distinction is deliberate. Evidence is not choice, and choice is not evidence.

---

## Repository structure

```
index.html              Landing page
try.html                Live demo — upload a label photo, get the analysis
privacy.html            Privacy policy
legal.html              Legal notice
sitemap.xml             Generated — do not edit by hand
llms.txt                Site summary for language models
triggers-master.json    Generated — the app's detection table
master_kb.json          Generated — the chatbot's knowledge base

pages/                  Long-form pages, read at home
ingredients/            104 ingredient records + 8 layer WebViews
i18n/{lang}/            All translatable content, 14 languages
i18n/glossary.json      Controlled terminology — the source of truth
botia/assets/           CSS, JS, icons, menu.json
```

---

## Two kinds of page inside `ingredients/`

This is the single most important thing to understand before touching anything.

**Ingredient records** — 104 files such as `gelatine.html`, `e471.html`,
`tartrazine.html`. Long-form, indexable, reached from Google or from the index.
These are entry points.

**Layer WebViews** — 8 files: `sugar.html`, `sweetener.html`, `texture.html`,
`flavor.html`, `enumbers.html`, `halal.html`, `haram.html`, `mashbooh.html`.
Short screens the app opens with `?trigger=slug1,slug2`. Read standing in a
supermarket. They are the **result** of a scan, not a landing page.

Consequences:

- WebViews carry no footer and no "Try BOTIA" call to action. The user is already
  inside the app.
- WebViews carry `header_trigger_container` and `ingredient_link_container`, which
  the loader fills from the URL.
- `halal.html` receives no trigger. It is the outcome of nothing being flagged.
- Ingredient records carry the footer and may carry a discreet "Try BOTIA".

---

## How translation works

The HTML holds English text as a **static fallback**. The real content lives in
`i18n/{lang}/{module}.json` and is injected at runtime by
`botia/assets/js/i18n-loader.js`, matched by element `id`.

Language resolution order: `?lang=` in the URL → `localStorage` → browser locale
→ English.

When you change a text, change it in **three places**: the English JSON, the HTML
fallback, and the 13 remaining JSON files.

### Rules learned the hard way

Every one of these caused a real bug in production.

**`layers` is never translated.** The identifiers are `animal`, `muslim`, `woman`,
`sugar`, `sweetener`, `texture`, `flavour`, `enumbers`. They drive CSS classes and
routes. The visible label is translated separately, in `LAYER_LABELS` inside the
loader.

**`flavour` is spelled with a U** as a layer identifier. The WebView file is
`flavor.html` without a U. That is a filename, not an identifier. Do not unify them.

**Keys ending in `_link` are treated as URLs** by the loader and written into
`href`. Never put display text in a `_link` key. Use a separate `_text` key for
the label.

**Never translate from the target file.** Always translate from `i18n/en/`.
Reading the target as a source silently propagated Spanish into Italian across
60 modules.

**A failed translation must abort, not fall through.** A script that returns the
original text on failure will publish the wrong language and report success.

**Write translation prompts in English.** A prompt written in Spanish caused
DeepSeek to return Spanish instead of the target language.

**Single-word names are the highest risk.** `honey` came back as a term of
endearment in nine languages. `soy` came back as the verb *to be* in thirteen.
`can` came back as a tin container in Chinese. Give the engine context.

---

## What is generated, not written

Do not edit these by hand. Regenerate them.

| File | Generated from |
|---|---|
| `i18n/glossary.json` → `ingredient_names` | the 14 `ingredient_index.json` |
| `triggers-master.json` | `i18n/en/{slug}.json` |
| `sitemap.xml` | the HTML files that actually exist |
| `master_kb.json` | the 104 records × 14 languages |
| `i18n/{lang}/ingredient_index.json` → `aliases` | the detail files |

After adding an ingredient record, all five need regenerating, and `master_kb.json`
must be uploaded to the Cloudflare KV by hand.

---

## The glossary is the source of truth

`i18n/glossary.json` holds controlled terminology validated against EFSA, Codex
and EU regulations:

- **Immutable** — identifiers, E-codes, brands, institution acronyms
- **Interface labels** — `can_title`, `cannot_title`, `sources-label` in 14 languages
- **Technical terms** — halal, haram, mashbooh, ultra-processed, free sugars
- **False friends** — documented cases, with the actual error each one produced
- **Ingredient names** — 104 slugs × 14 languages

Any translation script must check it before sending anything to an API.

---

## Editorial rules

**Distinguish association from causation.** If the evidence is observational,
say so. Do not write "causes" where the source says "is associated with".

**Distinguish hazard from risk.** An IARC classification describes hazard, not
risk at dietary exposure.

**Do not group substances.** EFSA assessed five specific phthalates. BHA and BHT
have different IARC classifications. Parabens vary by compound.

**Authorised does not mean safe in absolute terms. Banned does not mean dangerous.**
Jurisdictions differ. Say which one you mean.

**Never promise detection of what a label does not declare.** Contaminants and
packaging migrants have no ingredient record and no trigger. That is the product
definition, not a limitation.

**NOVA is a FAO publication**, by Monteiro et al. Not a joint FAO/WHO report.

**Maltodextrin is not a WHO free sugar.** It is a polysaccharide.

**The WHO 2023 non-sugar sweetener guideline excludes polyols.** Explicitly.

---

## Backend

The app and `try.html` both post an image to a Google Cloud Function.
It runs OCR with Gemini, then a deterministic Python rules engine, then writes
two rows to Google Sheets and returns JSON.

The two-step write is a security barrier. The OCR result is logged **before** the
decision engine runs, and the function exits if no usable ingredient list came
back. That barrier exists because a prompt injection attempt once reached the
engine, and the Sheets record was the only evidence of what had happened.
**Do not merge the two writes.**

Response shape:

```json
{
  "product_name": "…",
  "decision": "halal | haram | doubt",
  "muslim_trigger": "…",
  "muslim_note": "…",
  "woman": "specific | general",
  "layers": ["animal", "texture", "enumbers"],
  "triggers": [
    { "slug": "…", "name": "…", "e_code": "…", "layers": [], "url": "…" }
  ],
  "ingredients_read": "…",
  "ingredients_analysis": "…",
  "lang": "es",
  "region": "NL"
}
```

The chatbot runs on a separate Cloudflare Worker with its own knowledge base
in KV. It answers only from BOTIA content.

---

## Adding an ingredient

1. Create `ingredients/{slug}.html` — copy `gelatine.html` exactly
2. Create `i18n/en/{slug}.json` — copy `gelatine.json` exactly
3. Translate to the 13 remaining languages
4. Add it to the 14 `ingredient_index.json`
5. Regenerate the glossary, the triggers, the sitemap and `master_kb.json`
6. Upload `master_kb.json` to the Cloudflare KV

Two sources minimum, with real URLs. WHO and JECFA take precedence over regional
regulators.

---

## Companion repository

`BOTIA-Knowledge-Base` (private) holds the source documents behind every claim,
with SHA-256 checksums and a strict separation between `/official/` and
`/botia-criteria/`. No BOTIA statement may cite a `/botia-criteria/` document as
if it were an official source.

---

## Licence

Content © ServiceHub. Referenced documents remain the property of their
respective authors.

**Built with criteria. Defended with documentation.**
