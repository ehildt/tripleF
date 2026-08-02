# @triplef.io/server

## 1.3.0

### Minor Changes

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
- 845278c: - Intent-classification engine rewritten: template + prompt-variant selection, primary intent, tool selection as multi-set composition, language detection (ISO-639-1), context summaries for follow-ups, and clarification questions in the user's language
  - Templates: article, news, describe, compare, ocr, summary, evaluation, product, shoplist, imagelist, videolist, text(+coding/familiarity) — each with a strict Zod output schema the dashboard renders as structured UI
  - Structured-output validators with correction-prompt retries; non-structured templates stream directly
  - Media rules shared across templates: hero media, galleries, video galleries, sources; hero video requires a title (schema-refined) so popout/playlist/marquee surfaces are always named
  - Imagelist requires an explicit image-only request — informational requests (recipes, how-tos, guides) classify as article/text with image tools instead
  - Evaluation template always gathers image/video media for its subject (hero + galleries), matching article behavior
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
