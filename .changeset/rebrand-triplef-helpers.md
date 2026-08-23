---
"@triplef/helpers": patch
---

- Rebranded from `@ehildt/ckir-helpers` to `@triplef/helpers`: package name, README, badges, changelog title, and wiki docs now use the `@triplef` scope
- `repository.url` corrected to `https://github.com/ehildt/tripleF.git`
- Package docs migrated from `packages/helpers/.wiki/` into the tripleF monorepo wiki (sections `5.*`)
- Published with npm trusted publishing (OIDC, provenance) via the monorepo `RELEASE_CI` pipeline — no long-lived npm tokens
