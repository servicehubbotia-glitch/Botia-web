# BOTIA consolidation — reviewed working copy

## Original phase commits retained

- `0a2f4a1` — shared menu CSS and JavaScript
- `33311e1` — objective HTML and metadata repairs
- `ee0da4c` — unified i18n loader with English fallback
- `1316e15` — resource inventory, no deletions
- `23e6858` — rejected architecture move (retained in history only)
- `de42542` — original static validation report

## Independent corrections

- Reverted `23e6858` because it moved five functional category pages out of `ingredients/`, contrary to the immutable architecture rule.
- Restored the Halal, Haram and Mashbooh WebView trigger and ingredient-link behaviour lost during the i18n consolidation.
- Restored translated shared WebView labels and backwards-compatible BOTIA loader methods.
- Confirmed the consolidated menu contains no old inline menu implementations and points to the restored routes.

See `AUDIT-CORRECTION-REPORT.md` for findings, validation and remaining review items.

## Deployment status

This is a reviewed working copy. Production was not modified. A real-browser smoke test is still required before deployment because local browser navigation is blocked in the audit environment.
