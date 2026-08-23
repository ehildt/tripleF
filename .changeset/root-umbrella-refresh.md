---
'@triplef/triplef': minor
---

- CI/CD: consolidated the release workflow — removed the standalone `release.ci.yml` and deduplicated `ci.yml` / `non-release.ci.yml` (single root install + per-workspace verification).
- `@triplef/config-factory`: exposed a root export so consumers can `import { ConfigFactoryModule } from '@triplef/config-factory'` instead of the repetitive `@triplef/config-factory/config-factory` subpath (existing subpaths kept for backward compatibility).
