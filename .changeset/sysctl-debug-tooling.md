---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- SysCtl evolved into the system control center: search-engines providers, preprocessing settings, system connection + health tiles, tab visibility, and widgets
- All runtime provider configs persisted in the database via provider overrides (encrypted API keys with `TRIPLEF_SECRETS_KEY`, masked in every API response, lazy restore with backoff on boot)
- Legacy config rows migrate on boot (e.g. Serper `webpageFetch` → `scrape`); masked keys are never accepted back as real keys
- Ollama connection (host + API key, local or Ollama Cloud) runtime-tunable via a sibling overrides controller
- Debug tab overhauled: request list/tags, request details with endpoint/token/payload tabs, live queue console; fixed a sorting bug in the debug list
- SysCtl config loads through URL-keyed fetch helpers with clamped endpoint results
