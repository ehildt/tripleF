---
"@triplef/dashboard": patch
---

Migrate all 14 original dashboard Pinia stores to explicit domain ownership. Group widget-owned state under `stores/widgets/`, retain canonical shared records and synchronous store mutations, and move fetching, lifecycle, socket, timer, and workflow concerns to their owning composables and API modules.

Co-locate pure parsing, validation, normalization, key-building, and transformation helpers with focused coverage. Remove obsolete stores, proxy providers, compatibility forwarders, and duplicated server-page/request-history state while preserving storage identities, persistence behavior, streaming/retry/cancellation semantics, server contracts, and user-visible fallbacks.

Document the ownership decisions and add a mandatory post-implementation placement and purity audit for stores, composables, and helpers to the project skills.

Resolves #89.
