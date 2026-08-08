---
"@triplef.io/dashboard": minor
"@triplef.io/server": minor
---

- Dashboard: full i18n foundation with vue-i18n — 72 locale bundles, `locale-codes` source of truth, `use-locale` composable, and native (endonym) language names resolved via `Intl.DisplayNames`
- Dashboard: new language selector menu with search, teleported dropdown, and persisted language preference applied across the app
- Dashboard: language list now shows real SVG flags via `flag-icons` (Windows-safe, unlike emoji), with a globe fallback for regional languages that have no country flag (Catalan, Basque, Galician)
- Dashboard: removed the dead iconify dependencies (`@iconify/json`, `@iconify/tailwind4`) and the Tailwind icon plugin; flags are imported as individual SVGs so only the used ones ship
- Server: language detection (ISO-639-1) threaded through the harness — intent-selection prompt, classify/execution message builders, and harness job/stream DTOs carry the language so clarification questions and responses are generated in the user's language
