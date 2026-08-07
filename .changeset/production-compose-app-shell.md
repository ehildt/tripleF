---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- Production stack added: `compose.prod.yml` builds the prod-optimized server + dashboard (nginx-served static assets proxying `/api` and `/socket.io`), with infra host retargeting
- App shell refactored: `AppMainContent` removed in favor of a router-driven layout; new router, app store tab state, and app view context
- Shared input components (text, textarea, number, combo-box, switch) and debug section updated
