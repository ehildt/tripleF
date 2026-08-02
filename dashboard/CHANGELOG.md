# @triplef.io/dashboard

## 0.4.0

### Minor Changes

- 845278c: - Chat right panel: attachments/files with previews, message history view, playlist queue with now-playing marquee, and transport controls
  - Add-to-playlist toggle on every video surface: video lists, gallery items, hero media, product spotlight media
  - Floating player: single app-level mounted player docked over its source figure via CSS anchors, popping out into a draggable/resizable window when off-screen — playback survives tab and conversation switches
  - Floating playlist widget with playlist persistence, autoplay queue capture, and background-play settings
  - Video popout/now-playing contract fixed: hero videos synthesized from tool candidates now carry the candidate's title (title bar + marquee), and title-less heroes are dropped exactly like the server schema requires
  - Synthesized gallery/video entries satisfy the response contract: nameless candidates skipped, captions fall back to candidate titles
  - Context-usage indicator in the conversation header and conversation compaction flow
- 845278c: - Server: dead-letter queue module — terminal BullMQ failures copied into the persisted DLQ with full envelope context; editable and re-instatable entries
  - Server: DLQ lifecycle service with status flow (failed → active → cleared/deleted), retry with backoff, and event emission
  - Server: `/bullmq` live queue status endpoint feeding the queue console; job logger via `@ehildt/nestjs-bullmq-logger`
  - Dashboard: complete DLQ panel — list rows with status badges and filters, details body with error/metadata/prompt/payload tabs, payload editor with filter-update mutations, re-instate/retry actions
  - Dashboard: DLQ composables for action availability, details state, failure text resolution, payload editing, and loading states
- 845278c: - Server: dedicated sanitize pipeline step — live URL probing, broken/sub-720p image and thumbnail removal, and page-URL blanking before the response model ever sees tool results
  - Server: perceptual-fingerprint dedupe of image candidates and a persisted shown-media registry so media-list follow-ups never repeat what the user already saw
  - Server: external images are downloaded and re-hosted in MinIO; bot-protected or failing origins are dropped and blanked from tool results (no dead tiles client-side)
  - Server: image pool widened (default 12 per query) and ingestion now works until the target count is stored — a hotlink-blocked host is replaced by the next candidate instead of shrinking the gallery
  - Server: media ordering rules — web-article videos first, YouTube results outrank Serper videos, images last in tool context
  - Server: lightweight CLD3 language detection partitions foreign-language articles/videos into `internationalArticles`/`internationalVideos`; nothing is discarded, undetermined language stays in the primary pool
  - Dashboard: new InternationalCoverageSection rendered in every structured template as an "international coverage" aside next to primary-language content
- 845278c: - Server: PostgreSQL persistence via Prisma — typed client module, config service with Joi validation, and generated client under `src/generated/`
  - Server: persisted entities established: `harness_conversation` (session/conversation-scoped exchanges), `harness_dlq`, `harness_provider_override`, `harness_shown_media`, `harness_config`
  - Server: MinIO module — S3-compatible storage for user image payloads with bucket lifecycle management and startup job reinstatement (re-queues interrupted jobs after crash/restart)
  - Server: storage controller with session/conversation/hash-scoped GET and DELETE endpoints; payloads fetched through media-URL validation (SSRF-guarded schemes/targets)
  - Dashboard: conversations persisted to the server and rehydrated on load (fetch/save/delete conversation APIs)
- 845278c: - Server: Serper tool family consolidated and explicitly named — `serperBusinessReviewsSearch` (Google Maps reviews by `cid`/`placeId`), `serperWebpageScrape` (rendered page text), plus web/image/news/places/shopping/video search; legacy `webpageFetch` config rows migrate to `scrape` on boot
  - Server: `youtubeVideoSearch` tool via the official YouTube Data API v3 (`search.list` + batch `videos.list` enrichment: duration, views, channel, language, direct thumbnails), enabled by `YOUTUBE_API_KEY` or SysCtl
  - Server: per-provider/end-point enable+toggles and result counts runtime-managed; sources config supports preferred/blocked domain policy applied before the model sees results
  - Server: search queries are date-anchored and support an optional recency window (day/week/month/year) on web, image, and news search
  - Dashboard: SysCtl Search Engines section — per-provider cards with enable, masked API key management, and per-endpoint results
  - Dashboard: prompt-bar source tags list available search engines; one `videos` tag toggles both Serper and YouTube providers
- 845278c: - SysCtl evolved into the system control center: search-engines providers, preprocessing settings, system connection + health tiles, tab visibility, and widgets
  - All runtime provider configs persisted in the database via provider overrides (encrypted API keys with `TRIPLEF_SECRETS_KEY`, masked in every API response, lazy restore with backoff on boot)
  - Legacy config rows migrate on boot (e.g. Serper `webpageFetch` → `scrape`); masked keys are never accepted back as real keys
  - Ollama connection (host + API key, local or Ollama Cloud) runtime-tunable via a sibling overrides controller
  - Debug tab overhauled: request list/tags, request details with endpoint/token/payload tabs, live queue console; fixed a sorting bug in the debug list
  - SysCtl config loads through URL-keyed fetch helpers with clamped endpoint results

### Patch Changes

- 845278c: - Re-branding to `@triplef.io/*` scoped packages with refreshed README/depbadge manifests in both workspaces
  - Wiki overhauled: singular first-person voice, harness step-engine deep-dive, grounding-tools inventory, international coverage documentation, quick-start env tables with `SERPER_API_KEY`/`YOUTUBE_API_KEY`
  - Provider-overrides REST surface documented (masked GET, collection PUT, per-provider reset, boot migrations, Ollama sibling controller)
  - Railway deployment setup
  - Testing wiki updated; CI test hygiene — intentional negative-path logger output no longer pollutes test stderr, jsdom canvas stubbed quietly in the test setup, composable tests run lifecycle-clean, spec fixtures typed without prop-cast workarounds
- 845278c: - Expandable toolbar menus (conversation list, subscribed events) now teleport to the body as floating dropdowns anchored below their divider — no longer hidden behind the chat column or video popouts (z-index aligned with the model-select menu, re-anchoring on scroll, resize, and toolbar reflow)
  - Menu positioning hardened for lists that mount already-expanded (persisted open state): coordinates resolve on mount, no toggle required
  - Content copy button for assistant responses (markdown-rendered exchanges to clipboard)
  - App header and footer updated
  - Model-select dropdown anchors correctly while tracking trigger position on open/scroll/resize
