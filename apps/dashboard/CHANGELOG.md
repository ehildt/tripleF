# @triplef/dashboard

## 0.6.5

### Patch Changes

- 8ee933f: Unify Memory menus and surface styling, replace the metadata column with draggable multi-panel glassy details views, add an independent taxonomy Tags view, and pause constellation rotation safely during hover and open panels.
- 8ee933f: Restore node labels through the memory listing APIs and render populated hub-node-leaf hierarchies without empty synthetic constellation levels.
- 7d9137c: Fix hidden playlist video popouts reappearing after conversation switches and keep the visibility toggle functional. Fixes #132.
- 8ee933f: Make taxonomy Tags routing reliable, decouple registry metadata from constellation loading, render populated single-leaf hub-node-leaf chains, scope label resolution to the correct parent, and aggregate taxonomy counts without per-row query fan-out.

## 0.6.4

### Patch Changes

- 55d3224: Fix the chat globe toggle to disable and restore only previously enabled search engines, leaving disabled-but-configured engines unchanged.
- edf310e: Make chat activity updates accurately distinguish memory, knowledge, web, and tool-review work with localized cyberpunk labels, and split locale schemas and catalogs into domain modules without changing translation key paths.
- 463ba2e: Highlight Markdown strong text with the theme accent, render active history marquees as sanitized inline Markdown, and keep marquee scrolling at a constant speed across text lengths.

## 0.6.3

### Patch Changes

- 5a7ab35: Migrate all 14 original dashboard Pinia stores to explicit domain ownership. Group widget-owned state under `stores/widgets/`, retain canonical shared records and synchronous store mutations, and move fetching, lifecycle, socket, timer, and workflow concerns to their owning composables and API modules.

  Co-locate pure parsing, validation, normalization, key-building, and transformation helpers with focused coverage. Remove obsolete stores, proxy providers, compatibility forwarders, and duplicated server-page/request-history state while preserving storage identities, persistence behavior, streaming/retry/cancellation semantics, server contracts, and user-visible fallbacks.

  Document the ownership decisions and add a mandatory post-implementation placement and purity audit for stores, composables, and helpers to the project skills.

  Resolves #89.

- 5a7ab35: Migrate the dashboard's remaining Tailwind utility classes to component-owned plain CSS with BEM class names, covering panels, panel headings, conversation icons, DLQ actions and status badges, and Storybook examples. Keep Tailwind's PostCSS integration and Preflight reset in place, remove stale utility selectors, and document the plain-CSS convention.

  Resolves #121.

- 5a7ab35: Switch all first-party code to the PolyForm Strict License 1.0.0. Noncommercial use remains permitted for individuals, companies, and other organizations, but modification, redistribution, and commercial use require separate permission from the copyright holder.

  Update package license metadata, license badges, project descriptions, and contribution guidance to match. Third-party dependencies remain subject to their original licenses. Versions previously released under MIT or AGPL terms remain available under those terms.

## 0.6.2

### Patch Changes

- 565a256: Move object storage to RustFS and the AWS S3 SDK, use vendor-neutral application and health names, and serve media exclusively from `/api/v1/object-storage`.
- 565a256: Split monolithic module boundaries into focused services and helpers, tighten entry-point delegation, and align the affected dashboard and memory surfaces without changing their public behavior.

## 0.6.1

### Patch Changes

- db45436: Refactor the chat composables and helpers to one concern per file.

  Split the ~570-line `useSubmit` god-composable into focused units: `usePromptDraft` (the prompt text plus its persisted draft, still reading the legacy `'api-fields'` field so existing drafts survive), `useHarnessRequest` (the harness POST, socket request tracking, and pending-attachment promotion), and a thin `useSubmit` that owns only the submit flow and the `isSubmitting` flag. All in-function store instantiations now happen once at setup.

  Extract the remaining pure logic into one-function-per-file helpers with specs: `buildSubmitQueryParams`, `findSourceProviders`, `mergeSourceEndpoint`, `resolveSourceTargets`, `buildMirroredOverrides`, `isSourceToggle`, `sessionSourceEnabled`, and `collectProviderSources`. Move `listSearchSources` and its peers into the `helpers/` folder, and thin `useSearchEngineAvailability` down to the actions it actually performs.

  Replace the scattered `Record<string, unknown>` shapes with named provider-override types (`ProviderOverrides`, `ProviderSessionOverrides`, `ProviderOverrideEntry`, `ProviderSourceEndpoint`, `SearchSourceToggle`).

  Renames: `arguments_` → `promptDraft`, `persistArguments` → `persistPromptDraft`, `loading` → `isSubmitting`, `submitRest` → `submitCurrentPrompt`, `ensureConversation` → `ensureActiveConversation`, `buildConversation` → `buildPromptPayload`, `sendRequest` → `postHarnessRequest`. Adds co-located specs for the new composables and helpers.

- cc76ef4: Complete the `ChatLeftToolbar` conversations/sockets groups to match the intended example: named open-state computeds (no `.value` in templates), `hasConversations` gating, named toggle/type handlers moved into composables, `v-model` for the stream-settings inputs, and `mouseenter`/`mouseleave` events instead of hover props on the conversation and stream menus. Also merges a duplicated vision-capability watcher.
- cc76ef4: Migrate the chat left toolbar to store-based architecture. New Pinia stores own the toolbar state: `useLeftToolbarStore` (exclusive menus, model selection incl. vision/numCtx sync, conversation list + subscriptions, new-conversation draft, stream mode, disabled-feedback blink) and `useAttachedFilesStore` (pending-file map, replacing the hand-rolled module state file). Removed the provide/inject context, the `onClickOutside` coordinator (menus now self-close via a teleported backdrop, matching the slide-over/lightbox pattern), and the `defineExpose` template-ref plumbing — `Chat.vue` reads the stores directly and owns the hidden file input. Toolbar leaves are now purely presentational (props in / events out); the three group components are the containers that read the stores. Also fixes a latent jsdom test gap by mocking `URL.createObjectURL`/`revokeObjectURL` in the attached-files spec.
- 378b6e9: Rework the chat toolbar's conversation-creation menu: rename `NewConversationMenu` to `ConversationMenu`, split it into an orchestrator, a `ConversationMenuTrigger`, and presentational leaves backed by a co-located `useConversationMenu` composable, removing the form-state prop drilling from `ChatToolbar`.
- e46c218: Separate the chat history panel from the shared `ExpandableMessageList`.

  The history panel now renders its own `HistoryList` component group (`HistoryList` orchestrator + `HistoryListItem` rows), owned by the expanded `useHistoryPanel` composable — the list rows, the active-exchange marquee, merge availability/arming, and the per-row copy/include/merge/branch/delete actions all live next to the history panel that consumes them.

  The shared `ExpandableMessageList` is slimmed back to its read-only dlq/debug purpose (`items`/`renderHtml`/`onClick`/`expandAll`), dropping the history-only action buttons, the dead copy button, and the `MessageListItem` merge/context fields. Its consumers (`DlqPromptSection`, `RequestDetails`) are unchanged.

  `useChatConversation` is reduced to the chat orchestrator's slice (`conversationId`, `conversation`, `selectedModelObj`), and `mapExchangeToListItem` moves into the history group's `helpers/` folder.

- 01134ef: Consolidate the preprocessing panel and de-duplicate the settings actions bar.

  Extract the image-preview cluster out of `PprocToolsPanel` into a self-contained `PprocImagePreview` component that owns the trigger button, hidden file input, shared lightbox, and repick action together with its preview composable; the panel shrinks to the actions bar plus its three sections. Introduce a shared `PanelActions` bar (end-aligned radiant gradient) and adopt it across the preprocessing panel and the system/tab-menu/toast/playlist settings panels, removing five copy-pasted CSS blocks.

  Normalize the preprocessing store import to the `@/` alias and drop the now-invalid compiler-macro imports (`defineProps`, `defineEmits`) that `@vue/compiler-sfc` no longer accepts.

- 378fdb2: Remove Playwright and browser automation throughout the workbench.

  BREAKING: `BROWSER_TOOL_NAMES`, every `browser_*` tool description, and the shared `ProviderConfig` export are gone from `@triplef/agent/schemas`. The server no longer connects to a Playwright MCP sidecar or offers browser tools to models. The dashboard no longer includes Playwright-backed Vitest browser projects or the Storybook Vitest addon; its remaining tests run in jsdom.

- b6e6476: Strict five-tier macro-taxonomy chain: cluster → community → hub → node → leaf (partition and encyclopedia lanes alike). The LLM contracts gain the named NODE tier below the hub (extraction, encyclopedia classify, remember tool, taxonomy probe) with all four chain labels mandatory — partial chains fail the schema and go through correction instead of entering the registry. Memory writes refuse incomplete chains after normalization; point payloads carry the new `node` field; `listLeaves` serves node (and tag) items. The dashboard drill follows the strict chain (hub view lists nodes, node/tag views show leaves) with a fifth harmony tint; the constellation renders node-tier aspect dots inside hub blobs (dot per distinct aspect, tinted in the topic color, registry meta attached) and leaf dots carry their node label. The preprocessing config is now strictly session-scoped server state: fetched on store construction (no boot idle-push), pushed immediately on change (no debounce), with the load echo guarded. NOTE: existing taxonomy data is incompatible — drop and rebuild.

## 0.6.0

### Minor Changes

- ec0d0a5: - **Memory constellation**: new 3D visualization with a ZERO root, category/sub-category hierarchy, community hubs, expand/collapse animations, semantic zoom, leaf orbit, and a collapsible metadata column; configurable node limit (default 5000).
  - **Document preview**: modal preview for fetched documents (text + media).
  - **Media handling**: add-to-files button, YouTube thumbnail/video-poster fallbacks, storage-image hash extraction.

## 0.5.0

### Minor Changes

- 5eb1f5c: - Chat right panel: attachments/files with previews, message history view, playlist queue with now-playing marquee, and transport controls
  - Add-to-playlist toggle on every video surface: video lists, gallery items, hero media, product spotlight media
  - Floating player: single app-level mounted player docked over its source figure via CSS anchors, popping out into a draggable/resizable window when off-screen — playback survives tab and conversation switches
  - Floating playlist widget with playlist persistence, autoplay queue capture, and background-play settings
  - Video popout/now-playing contract fixed: hero videos synthesized from tool candidates now carry the candidate's title (title bar + marquee), and title-less heroes are dropped exactly like the server schema requires
  - Synthesized gallery/video entries satisfy the response contract: nameless candidates skipped, captions fall back to candidate titles
  - Context-usage indicator in the conversation header and conversation compaction flow
- 5eb1f5c: - Server: dead-letter queue module — terminal BullMQ failures copied into the persisted DLQ with full envelope context; editable and re-instatable entries
  - Server: DLQ lifecycle service with status flow (failed → active → cleared/deleted), retry with backoff, and event emission
  - Server: `/bullmq` live queue status endpoint feeding the queue console; job logger via `@ehildt/nestjs-bullmq-logger`
  - Dashboard: complete DLQ panel — list rows with status badges and filters, details body with error/metadata/prompt/payload tabs, payload editor with filter-update mutations, re-instate/retry actions
  - Dashboard: DLQ composables for action availability, details state, failure text resolution, payload editing, and loading states
- 5eb1f5c: - Server: dedicated sanitize pipeline step — live URL probing, broken/sub-720p image and thumbnail removal, and page-URL blanking before the response model ever sees tool results
  - Server: perceptual-fingerprint dedupe of image candidates and a persisted shown-media registry so media-list follow-ups never repeat what the user already saw
  - Server: external images are downloaded and re-hosted in MinIO; bot-protected or failing origins are dropped and blanked from tool results (no dead tiles client-side)
  - Server: image pool widened (default 12 per query) and ingestion now works until the target count is stored — a hotlink-blocked host is replaced by the next candidate instead of shrinking the gallery
  - Server: media ordering rules — web-article videos first, YouTube results outrank Serper videos, images last in tool context
  - Server: lightweight CLD3 language detection partitions foreign-language articles/videos into `internationalArticles`/`internationalVideos`; nothing is discarded, undetermined language stays in the primary pool
  - Dashboard: new InternationalCoverageSection rendered in every structured template as an "international coverage" aside next to primary-language content
- 7f801a8: - Dashboard: full i18n foundation with vue-i18n — 72 locale bundles, `locale-codes` source of truth, `use-locale` composable, and native (endonym) language names resolved via `Intl.DisplayNames`
  - Dashboard: new language selector menu with search, teleported dropdown, and persisted language preference applied across the app
  - Dashboard: language list now shows real SVG flags via `flag-icons` (Windows-safe, unlike emoji), with a globe fallback for regional languages that have no country flag (Catalan, Basque, Galician)
  - Dashboard: removed the dead iconify dependencies (`@iconify/json`, `@iconify/tailwind4`) and the Tailwind icon plugin; flags are imported as individual SVGs so only the used ones ship
  - Server: language detection (ISO-639-1) threaded through the harness — intent-selection prompt, classify/execution message builders, and harness job/stream DTOs carry the language so clarification questions and responses are generated in the user's language
- 95c4b7c: - Playlist menu refactored into a `PlaylistMenu` with a new `PlaylistMenuItem` component (spec + stories added)
  - `use-playlist-library` and `saved-playlists` state reworked; floating playlist and playlist-menu stories updated
  - Server `.env.example` documents the new playlist-related env vars
- 95c4b7c: - New playlist panel with queue management, plus a reusable `CollapsiblePanel` component
  - Settings sections expanded: search-engines, system, widgets (toast/video-popout/tab-menu panels), and a new playlist-preview widget
  - Floating playlist and playlist-settings state reworked; `use-right-toolbar-view` composable added
- 95c4b7c: - Server: playlists persisted to PostgreSQL via a new `HarnessPlaylist` Prisma model and a playlist controller (list by session/conversation, save, rename, delete)
  - Dashboard: `playlists.api` client for the new endpoints; playlist state refactored around server persistence, replacing the browser-only saved-playlists store
- 5eb1f5c: - Server: PostgreSQL persistence via Prisma — typed client module, config service with Joi validation, and generated client under `src/generated/`
  - Server: persisted entities established: `harness_conversation` (session/conversation-scoped exchanges), `harness_dlq`, `harness_provider_override`, `harness_shown_media`, `harness_config`
  - Server: MinIO module — S3-compatible storage for user image payloads with bucket lifecycle management and startup job reinstatement (re-queues interrupted jobs after crash/restart)
  - Server: storage controller with session/conversation/hash-scoped GET and DELETE endpoints; payloads fetched through media-URL validation (SSRF-guarded schemes/targets)
  - Dashboard: conversations persisted to the server and rehydrated on load (fetch/save/delete conversation APIs)
- 95c4b7c: - Product response template refactored: the spotlight hero/info/media components are replaced by a single `ProductBanner` (title, rating overlay, hero image) plus a `ProductProsCons` block and a brief lead description
  - Video gallery supports a forced fixed column count (e.g. three review videos in a row) that overrides the responsive count-based layout
  - Shop offer card redesigned with bordered card styling
  - Product instruction prompt updated to match the new banner/pros-cons output contract
- 95c4b7c: - Production stack added: `compose.prod.yml` builds the prod-optimized server + dashboard (nginx-served static assets proxying `/api` and `/socket.io`), with infra host retargeting
  - App shell refactored: `AppMainContent` removed in favor of a router-driven layout; new router, app store tab state, and app view context
  - Shared input components (text, textarea, number, combo-box, switch) and debug section updated
- 5eb1f5c: - Server: Serper tool family consolidated and explicitly named — `serperBusinessReviewsSearch` (Google Maps reviews by `cid`/`placeId`), `serperWebpageScrape` (rendered page text), plus web/image/news/places/shopping/video search; legacy `webpageFetch` config rows migrate to `scrape` on boot
  - Server: `youtubeVideoSearch` tool via the official YouTube Data API v3 (`search.list` + batch `videos.list` enrichment: duration, views, channel, language, direct thumbnails), enabled by `YOUTUBE_API_KEY` or Settings
  - Server: per-provider/end-point enable+toggles and result counts runtime-managed; sources config supports preferred/blocked domain policy applied before the model sees results
  - Server: search queries are date-anchored and support an optional recency window (day/week/month/year) on web, image, and news search
  - Dashboard: Settings Search Engines section — per-provider cards with enable, masked API key management, and per-endpoint results
  - Dashboard: prompt-bar source tags list available search engines; one `videos` tag toggles both Serper and YouTube providers
- 5eb1f5c: - Settings evolved into the system control center: search-engines providers, preprocessing settings, system connection + health tiles, tab visibility, and widgets
  - All runtime provider configs persisted in the database via provider overrides (encrypted API keys with `TRIPLEF_SECRETS_KEY`, masked in every API response, lazy restore with backoff on boot)
  - Legacy config rows migrate on boot (e.g. Serper `webpageFetch` → `scrape`); masked keys are never accepted back as real keys
  - Ollama connection (host + API key, local or Ollama Cloud) runtime-tunable via a sibling overrides controller
  - Debug tab overhauled: request list/tags, request details with endpoint/token/payload tabs, live queue console; fixed a sorting bug in the debug list
  - Settings config loads through URL-keyed fetch helpers with clamped endpoint results
- 95c4b7c: - Wiki gains a "Business Logic" section explaining how the features work and their dependencies
  - Media extraction refactored: `extractMediaFromToolResults`/`extractMediaFromTools` helpers, verified-media filtering, and image-URL collection tightened; search-engine availability composable reworked
  - Sanitize action and media surfaces (article hero, video gallery/list items, product spotlight media) updated to the refactored pipeline
  - BrightData image search tool added

### Patch Changes

- 95c4b7c: - App view context now provides store-derived data as computed refs instead of one-time unwrapped values, so route views react to store changes (e.g. selecting a debug request updates the details panel, and models appear in the DLQ selector once they finish loading)
  - Debug section details panel updates reactively when a request is selected
- 5eb1f5c: - Re-branding to `@triplef/*` scoped packages with refreshed README/depbadge manifests in both workspaces
  - Wiki overhauled: singular first-person voice, harness step-engine deep-dive, grounding-tools inventory, international coverage documentation, quick-start env tables with `SERPER_API_KEY`/`YOUTUBE_API_KEY`
  - Provider-overrides REST surface documented (masked GET, collection PUT, per-provider reset, boot migrations, Ollama sibling controller)
  - Railway deployment setup
  - Testing wiki updated; CI test hygiene — intentional negative-path logger output no longer pollutes test stderr, jsdom canvas stubbed quietly in the test setup, composable tests run lifecycle-clean, spec fixtures typed without prop-cast workarounds
- 95c4b7c: - Dependency upgrades across the monorepo: Pinia 4, ESLint 10, Vite 8, Storybook 10.5.6, jsdom 30, markdown-it 15, dompurify 3.4.13, testing-library/jest-dom 7, dependency-cruiser 18, and related tooling
  - Workspace manifests and lockfiles regenerated for the new versions
- 95c4b7c: - Exchange header action buttons now pulse briefly on click so the user gets immediate feedback that the action registered
  - Shop offers section rendered as a responsive two-column grid (collapses to one column on narrow screens) with bordered offer cards instead of a stacked divider list
  - Removed the redundant "Copied to clipboard" toast on exchange copy — the pulse feedback replaces it
- 12b4c82: - Moved the assistant response meta-bar (category, publish date, read time, author/byline pills) out of the structured-response templates and into the exchange header, rendered right after the copy action for completed assistant exchanges
  - New `buildExchangeMetaPills` helper derives the pills from the parsed response data; template-specific pills that lived only in the meta-bar (evaluation score, image/video item counts) are no longer surfaced there
- 5eb1f5c: - Expandable toolbar menus (conversation list, subscribed events) now teleport to the body as floating dropdowns anchored below their divider — no longer hidden behind the chat column or video popouts (z-index aligned with the model-select menu, re-anchoring on scroll, resize, and toolbar reflow)
  - Menu positioning hardened for lists that mount already-expanded (persisted open state): coordinates resolve on mount, no toggle required
  - Content copy button for assistant responses (markdown-rendered exchanges to clipboard)
  - App header and footer updated
  - Model-select dropdown anchors correctly while tracking trigger position on open/scroll/resize
- 95c4b7c: - Floating video figure button restyled with a glassy frosted effect (translucent accent tint, backdrop blur, no border) instead of a solid fill
  - Article hero media header row now sits on a card backdrop so it doesn't float on the bare exchange background
- 95c4b7c: - Type-safety refactor across the harness and AI SDK: typed `SendRequestOptions`, `PlayerControls`, `YouTubePlayerStateEvent`, and `BuildActivityLabelParams` replace inline anonymous types
  - AI SDK params extracted into a dedicated `ai-sdk-params.types.ts`; harness actions (execute/interpret/respond/sanitize) and DLQ repository tightened with typed inputs
- 95c4b7c: - `stripHtml` consolidated into a single `@/utils/strip-html.helper` (regex-based) and removed from the drop-down/exchange helpers
  - `buildQueryParams` refactored to accept plain values instead of refs; conversation store gains a `patchConversation` helper replacing per-field setters
  - Harness content-system prompt and shared prompt index cleaned up
- 95c4b7c: - Dashboard `index.html` gains a meta description; prompt placeholder and conversation item copy updated
  - AI SDK `TimeoutConfiguration` typing relaxed to the generic form
- 95c4b7c: - `MotionIcon` applied across UI components: theme selector, nav menu, prompt action bar, model selector, new-conversation/stream-settings menus, DLQ action/reload buttons, floating media bar, and preview button
- 95c4b7c: - New `MotionIcon` component (with spec + stories) wrapping lucide icons in a motion animation; `motion-v` dependency added
  - Event subscriptions and stream-settings composables extended; conversation list and DLQ filter/header menus updated
  - Harness stream query DTO gains validation for the new query params
- 95c4b7c: - Playlist API helpers now URL-encode session, conversation, and playlist-name path segments (user input can contain spaces, slashes, `#`, `?`), with a dedicated spec covering save/list/rename/delete
  - Playlist state and related-stories handling tightened; DLQ filter menu and news schema adjusted
- 95c4b7c: - Playlist panel now detects whether the current conversation contains videos so the docked player's empty state and hints are reachable even with an empty queue
  - New `conversationHasVideos` helper with spec; floating media bar and playlist panel wiring updated
- 12b4c82: - Replaced the `ListCheck` icon with `ListMinus` on the playlist add/remove toggle across all media surfaces (floating media bar, video list items, hero media, video gallery items) to better communicate the "remove from playlist" state
- 95c4b7c: - Settings popout preview is now a persistent toggle (stays visible until dismissed) instead of a timed 3s preview; switching tabs dismisses it
  - Popup geometry uses a symmetric edge inset for anchored positions; preview button and video popout panel updated
- 95c4b7c: - Popout gains a "show bar always" setting (persisted in localStorage): when off, the media bar fades in on hover and out on leave so media fills the freed space
  - `FieldCard` supports hiding its checkbox while keeping the checked styling; floating popout and video popout panel updated
  - Playwright skill documents the `/dashboard/` base path for the sidecar; sharp constants adjusted
- 12b4c82: - Product banner shows a glassy "+N" image-count badge (same frosted look as the video/iframe play block) in the top-right corner of the figure, telling the user the total number of product images (banner + gallery)
- 95c4b7c: - New shared `SettingsSection` component (loading/error/panel layout) reused by the preprocessing and search-engines sections, replacing duplicated per-section state markup
  - SearchEnginesSection refactored onto `PanelLayout` + `SettingsSection`; panel header title simplified (chevron prefix removed)
- 95c4b7c: - Test infrastructure refactored: App, DebugSection, TabMenu, Chat, and Dlq specs now mount through a shared `mockAppViewContext` helper and install a memory router where RouterLinks are rendered
  - App spec mirrors the route into the app store via a memory router; debug/tab-menu specs provide the app view context through the injection key
- 95c4b7c: - Removed three game-inspired themes (ghostwire, wukong, yakuza) and their palette files
  - Theme store and Settings config adapters (serper/sources/youtube) refactored; DLQ list header and exclusive-filter-menu cleaned up
- 95c4b7c: - Toast container uses symmetric edge insets so an anchored stack sits the same distance from its two adjacent screen edges (top/bottom/left/right all `3rem`)

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
  - Server: `youtubeVideoSearch` tool via the official YouTube Data API v3 (`search.list` + batch `videos.list` enrichment: duration, views, channel, language, direct thumbnails), enabled by `YOUTUBE_API_KEY` or Settings
  - Server: per-provider/end-point enable+toggles and result counts runtime-managed; sources config supports preferred/blocked domain policy applied before the model sees results
  - Server: search queries are date-anchored and support an optional recency window (day/week/month/year) on web, image, and news search
  - Dashboard: Settings Search Engines section — per-provider cards with enable, masked API key management, and per-endpoint results
  - Dashboard: prompt-bar source tags list available search engines; one `videos` tag toggles both Serper and YouTube providers
- 845278c: - Settings evolved into the system control center: search-engines providers, preprocessing settings, system connection + health tiles, tab visibility, and widgets
  - All runtime provider configs persisted in the database via provider overrides (encrypted API keys with `TRIPLEF_SECRETS_KEY`, masked in every API response, lazy restore with backoff on boot)
  - Legacy config rows migrate on boot (e.g. Serper `webpageFetch` → `scrape`); masked keys are never accepted back as real keys
  - Ollama connection (host + API key, local or Ollama Cloud) runtime-tunable via a sibling overrides controller
  - Debug tab overhauled: request list/tags, request details with endpoint/token/payload tabs, live queue console; fixed a sorting bug in the debug list
  - Settings config loads through URL-keyed fetch helpers with clamped endpoint results

### Patch Changes

- 845278c: - Re-branding to `@triplef/*` scoped packages with refreshed README/depbadge manifests in both workspaces
  - Wiki overhauled: singular first-person voice, harness step-engine deep-dive, grounding-tools inventory, international coverage documentation, quick-start env tables with `SERPER_API_KEY`/`YOUTUBE_API_KEY`
  - Provider-overrides REST surface documented (masked GET, collection PUT, per-provider reset, boot migrations, Ollama sibling controller)
  - Railway deployment setup
  - Testing wiki updated; CI test hygiene — intentional negative-path logger output no longer pollutes test stderr, jsdom canvas stubbed quietly in the test setup, composable tests run lifecycle-clean, spec fixtures typed without prop-cast workarounds
- 845278c: - Expandable toolbar menus (conversation list, subscribed events) now teleport to the body as floating dropdowns anchored below their divider — no longer hidden behind the chat column or video popouts (z-index aligned with the model-select menu, re-anchoring on scroll, resize, and toolbar reflow)
  - Menu positioning hardened for lists that mount already-expanded (persisted open state): coordinates resolve on mount, no toggle required
  - Content copy button for assistant responses (markdown-rendered exchanges to clipboard)
  - App header and footer updated
  - Model-select dropdown anchors correctly while tracking trigger position on open/scroll/resize
