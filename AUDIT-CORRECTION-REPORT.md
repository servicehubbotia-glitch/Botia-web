# BOTIA — Independent audit and corrective consolidation

Date: 2026-07-17

## Scope

The delivered `Botia-web-main-phases1-6.zip` was compared with the imported baseline and reviewed against the repository's immutable architecture rule. No production repository was modified.

## Critical findings

### 1. Phase 5 changed the repository architecture

The delivered result moved these files from `ingredients/` to `pages/`:

- `ingredients/sugar.html`
- `ingredients/sweetener.html`
- `ingredients/texture.html`
- `ingredients/flavor.html`
- `ingredients/enumbers.html`

It also changed menu, internal, metadata and sitemap routes to `/pages/`. This contradicted the explicit rule that these functional ingredient pages must remain under `ingredients/`.

**Correction applied:** the Phase 5 commit was reverted. All five files and all affected references are restored to their original `ingredients/` paths.

### 2. Phase 3 broke the Halal, Haram and Mashbooh WebViews

The unified loader removed the public methods `BOTIA.detectLanguage()` and `BOTIA.loadTranslations()`, while the three WebView HTML files continued calling them. This produced a runtime JavaScript error.

The replacement loader also omitted the existing WebView behaviour that:

- reads the `trigger` URL parameter;
- displays the detected trigger in `header_trigger_container`;
- creates ingredient detail links inside `ingredient_link_container`;
- translates the shared WebView headings and disclaimer.

**Correction applied:**

- restored the trigger display and ingredient-link renderer;
- preserved the 14-language WebView labels;
- added backwards-compatible loader methods;
- removed the obsolete inline calls from the three HTML files;
- retained English fallback and the unified page loader.

The existing app hook is therefore present and active:

- `header_trigger_container`
- `ingredient_link_container`
- URL input: `?lang=<language>&trigger=<ingredient-or-code>`

Example generated link:

`?lang=es&trigger=E471,natural%20flavourings`

creates links to:

- `/ingredients/e471.html?lang=es`
- `/ingredients/natural_flavourings.html?lang=es`

## Menu review

The shared-menu consolidation itself was retained:

- one shared stylesheet: `/botia/assets/menu.css`;
- one shared script: `/botia/assets/js/menu.js`;
- no old inline `toggleSidebar`, `toggleSubmenu` or `filterSidebar` implementations remain in public HTML pages;
- menu routes point to the restored architecture under `ingredients/`.

## Validation completed

- 784 JSON files parsed successfully.
- 60 HTML files inventoried.
- 14 language directories contain identical JSON module sets.
- Shared JavaScript files pass `node --check`.
- Local HTML, CSS, image, script and stylesheet references resolve.
- No references remain to the rejected `/pages/sugar.html`, `/pages/sweetener.html`, `/pages/texture.html`, `/pages/flavor.html` or `/pages/enumbers.html` routes.
- Required category pages exist in `ingredients/` and not in `pages/`.
- WebView trigger rendering was unit-tested with Spanish `E471` and `natural flavourings` inputs.

## Browser-test limitation

This environment blocks browser navigation to local HTTP and file URLs with `ERR_BLOCKED_BY_ADMINISTRATOR`. A real browser smoke test must therefore be performed before deployment. Static validation and direct JavaScript unit testing completed successfully.

## Pre-existing items deliberately not changed

To respect the instruction not to alter texts or redesign pages, the audit did not change these pre-existing content/template mismatches:

- `free_sugars.json` and `fruit_juice_concentrate.json` contain `can_3` and `cannot_3`, but their HTML pages only contain slots for items 1 and 2.
- Some pages contain legacy redundant closing `</div>` markup that browsers tolerate. This existed in the imported baseline and was not removed during this corrective pass.

These should be reviewed separately rather than silently changed during repository consolidation.
