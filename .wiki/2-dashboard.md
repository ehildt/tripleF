# 2. Dashboard Overview

The 3F dashboard is a **Vue 3** single-page workbench — not a thin viewer: it owns sessions, steers the harness, and exposes everything the server can do.

- **Stack:** Vue 3 (Composition API, `<script setup>`), Vite 8, Pinia 4, TanStack Query, Tailwind CSS v4, VueUse, Headless UI, Lucide icons, socket.io-client, vue-router, vue-i18n, markdown-it + DOMPurify + Turndown (answer rendering), D3 (axis/scale/selection/shape/time-format/zoom) for stock-market charts and d3-force-3d for the memory constellation graph, an in-house toast widget
- **Entry:** `apps/dashboard/src/main.ts` → `App.vue` (Pinia + VueQuery + router + i18n plugins). Routing is handled by **vue-router** (`src/router/router.ts`): `/chat`, `/dlq`, `/debug`, `/settings`, with `/` redirecting to `/chat`.
- **Dev URL:** `http://localhost:5173/dashboard/` · proxies API to the server (`VITE_PROXY_TARGET`)

## The areas

| Area          | Path (`src/components/`) | What it is                                                                                                                                                                  |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chat**      | `chat/`                  | The main stage: conversation header (rename / delete / pin), exchange list, prompt action bar, right panel (incl. playlist), floating player, toolbar. See **2.2**.                                    |
| **Settings**    | `settings/`                | System control: provider configuration, preprocessing settings, search-engines (per-provider sections for Serper, Bright Data, EODHD + YouTube tools), layouts, interface visibility, chat navigation (scroll mode, media priority), system health, tab visibility, widgets, per-session model/config management, and the **memory section** — the memory partition id + the memory cognition space id (empty cognition = lives in the partition), the system-variables config panel (cognition limit, episode tuning, maintenance models/limits, auto-trigger flags — see **1.6** §9), read-out panels for the partition/cognition/encyclopedia spaces with refresh and armed two-click wipe, and the **constellation view** (the link-graph force visualization with frictions/clusters overlays). |
| **DLQ**       | `dlq/`                   | Dead-letter management: list of failed envelopes (polled every 30 s), detail view with payload editing, reinstatable back into the queue.                                   |
| **PProc**     | `pproc/`                 | Image preprocessing workbench: tools panel with file preview pipeline to inspect what variants the server will generate.                                                    |
| **App shell** | `app/`                   | Header (nav menu, tabs), footer, theme selector, language selector, main content switch.                                                                                       |
| **Widgets**   | `widgets/`               | Reusable floating UI: popout preview, floating playlist, toast system.                                                                                                         |

## What makes it a workbench

- **Session identity everywhere** — a session scopes conversations, config, and storage; the whole UI behaves as one continuous workspace per session.
- **Model awareness** — the dashboard fetches the live model catalogue (`GET /api/v1/harness/models`) and renders model-specific capabilities (context sizes, thinking modes).
- **Config push model** — on boot the dashboard pushes persisted preprocessing settings to the server (`preprocessingStore.pushSettingsToServer()`), so server-side effective config always matches what the UI shows.
- **Everything is inspectable** — the debug store records API/socket events; toasts surface operational outcomes; DLQ and health are first-class UI, not afterthoughts.

## Boot wiring (`App.vue`)

1. Theme initialised (`themeStore.initTheme()`), model catalogue fetched.
2. Preprocessing overrides pushed to the server.
3. Socket connection ensured (`socketStore.ensureSocketConnection()`) with callbacks wired to the debug + messages stores via `createSocketProvider`.
4. DLQ counter polled every 30 s.
5. Global UI mounted: `ToastContainer`, `PopoutPreview`.

## Internationalisation

UI copy is translated via **vue-i18n** (`src/i18n/`): typed message catalogs per locale (`src/i18n/locales/`), a `use-locale` composable, and a `LanguageSelector` in the app header. Locale choice is persisted and applied at runtime without a reload.

## Environment

| Variable            | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `VITE_API_URL`      | REST base (default dev proxy `/api`)                              |
| `VITE_SOCKET_URL`   | Socket.IO endpoint (`http://localhost:3000`)                      |
| `VITE_PROXY_TARGET` | Vite dev-server proxy target (`http://server:3000` in containers) |
| `VITE_MEMORY_API_URL` | Memory app REST base (default same-origin `/memory-api` proxy)  |
| `VITE_MEMORY_PROXY_TARGET` | Vite dev-server proxy target for the memory app (`http://memory:3400` in containers) |

## Related pages

- **2.1** — component/store architecture and conventions
- **2.2** — the chat experience in depth
- **2.3** — theming and color identity
