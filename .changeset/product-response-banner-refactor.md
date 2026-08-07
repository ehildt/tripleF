---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- Product response template refactored: the spotlight hero/info/media components are replaced by a single `ProductBanner` (title, rating overlay, hero image) plus a `ProductProsCons` block and a brief lead description
- Video gallery supports a forced fixed column count (e.g. three review videos in a row) that overrides the responsive count-based layout
- Shop offer card redesigned with bordered card styling
- Product instruction prompt updated to match the new banner/pros-cons output contract
