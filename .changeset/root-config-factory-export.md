---
'@triplef/config-factory': minor
---

Expose a root export (`@triplef/config-factory`) that re-exports the full public API (`ConfigFactoryModule`, `CacheReturnValue`, `ValidateReturnValue`, and their types). Consumers can now import `ConfigFactoryModule` from the package root instead of the repetitive `@triplef/config-factory/config-factory` subpath. Existing subpath exports remain available for backward compatibility.
