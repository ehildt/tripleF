---
"@triplef/config-factory": patch
---

- Rebranded from `@ehildt/nestjs-config-factory` to `@triplef/config-factory`: package name, README, badges, changelog title, and wiki docs now use the `@triplef` scope
- `repository.url` corrected to `https://github.com/ehildt/tripleF.git`
- Peer dependency updated from `@ehildt/ckir-helpers` to `@triplef/helpers`
- Apps (`@triplef/server`, `@triplef/memory`) updated to depend on and import the new package
- Package docs migrated into the tripleF monorepo wiki (sections `6.*`)
- Published with npm trusted publishing (OIDC, provenance) via the monorepo `RELEASE_CI` pipeline — no long-lived npm tokens
