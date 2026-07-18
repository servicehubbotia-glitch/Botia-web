# BOTIA — Phase 1 change log

## Scope
Consolidation of the existing hamburger menu only. No business logic, translations, metadata, content, routes, or page architecture were changed.

## Changes
- Added `/botia/assets/menu.css` as the single menu stylesheet.
- Added `/botia/assets/js/menu.js` as the single menu implementation.
- Removed embedded sidebar markup from 58 HTML files.
- Removed embedded `toggleSidebar`, `toggleSubmenu`, and `filterSidebar` copies.
- Removed embedded menu CSS while preserving the existing fixed-header and standalone-button visual variants.
- Preserved existing menu destinations and labels from the current consolidated menu.

## Reversal
- Restore `Botia-web-main.original.zip`, or revert the Phase 1 Git commit documented with the delivered archive.

## Files modified
- `index.html`
- `ingredients/acesulfame_k.html`
- `ingredients/alcohol.html`
- `ingredients/aspartame.html`
- `ingredients/bha.html`
- `ingredients/bht.html`
- `ingredients/bpa.html`
- `ingredients/cadmium.html`
- `ingredients/carmine.html`
- `ingredients/carrageenan.html`
- `ingredients/cyclamates.html`
- `ingredients/dioxins_pcbs.html`
- `ingredients/e171.html`
- `ingredients/e471.html`
- `ingredients/e472.html`
- `ingredients/endocrine-disruptors.html`
- `ingredients/enumbers.html`
- `ingredients/enzymes.html`
- `ingredients/erythritol.html`
- `ingredients/fat-accumulation.html`
- `ingredients/flavor.html`
- `ingredients/free_sugars.html`
- `ingredients/fruit_juice_concentrate.html`
- `ingredients/gelatine.html`
- `ingredients/glucose_syrup.html`
- `ingredients/glycerol.html`
- `ingredients/guar_gum.html`
- `ingredients/halal.html`
- `ingredients/haram.html`
- `ingredients/index.html`
- `ingredients/konjac.html`
- `ingredients/lead.html`
- `ingredients/lecithins.html`
- `ingredients/maltitol.html`
- `ingredients/maltodextrin.html`
- `ingredients/mashbooh.html`
- `ingredients/methylmercury.html`
- `ingredients/natural_flavourings.html`
- `ingredients/packaging-migrants.html`
- `ingredients/parabens.html`
- `ingredients/phthalates.html`
- `ingredients/saccharin.html`
- `ingredients/shellac.html`
- `ingredients/sorbitol.html`
- `ingredients/steviol_glycosides.html`
- `ingredients/sucralose.html`
- `ingredients/sugar.html`
- `ingredients/sweetener.html`
- `ingredients/texture.html`
- `ingredients/trans_fats.html`
- `ingredients/vinegar.html`
- `ingredients/xanthan_gum.html`
- `ingredients/xylitol.html`
- `pages/animal.html`
- `pages/evidence.html`
- `pages/muslim.html`
- `pages/woman.html`
- `privacy.html`
