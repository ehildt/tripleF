---
"@triplef/triplef": minor
---

- Added judged-only memory writes, a strict five-tier memory taxonomy with matching dashboard navigation and constellation updates, and known-tag reuse during enrichment. Existing taxonomy data must be dropped and rebuilt.
- Reworked dashboard chat, conversation history, toolbar, preprocessing, and settings surfaces into focused stores, composables, components, and helpers.
- Migrated object storage to RustFS through the AWS S3 SDK, split monolithic app boundaries into focused services and helpers, and removed Playwright and browser automation.
- Moved the detailed Kickoff instructions into the wiki Quick Start and linked the guide from the README.
