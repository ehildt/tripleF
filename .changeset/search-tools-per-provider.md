---
"@triplef.io/server": minor
---

- Search tools split into per-provider modules: BrightData (web/image/news/places/shopping/video search, webpage scrape) and Serper (web/image/news/places/shopping/video, business reviews, webpage scrape), each with its own constants and recency/image-size buckets
- Harness actions (execute/interpret/respond/sanitize) refactored into focused helpers (build messages, extract query, parse intent, wrap tools with execution events / search recency)
- Compose split into `compose.yml` (app) and `infra.compose.yml` (postgres/minio/keydb/playwright-mcp); README refreshed
