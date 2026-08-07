---
"@triplef.io/dashboard": patch
---

- Moved the assistant response meta-bar (category, publish date, read time, author/byline pills) out of the structured-response templates and into the exchange header, rendered right after the copy action for completed assistant exchanges
- New `buildExchangeMetaPills` helper derives the pills from the parsed response data; template-specific pills that lived only in the meta-bar (evaluation score, image/video item counts) are no longer surfaced there
