# 2. Dashboard Overview

The 3F dashboard is a **Vue 3** single-page workbench — not a thin viewer: it owns sessions, steers the harness, and exposes everything the server can do.

- **Stack:** Vue 3 (Composition API, `<script setup>`), Vite 8, Pinia, TanStack Query, Tailwind CSS v4, VueUse, Headless UI, socket.io-client, vue3-toastify
- **Entry:** `dashboard/src/main.ts` → `App.vue` (Pinia + VueQuery plugins, no router — the app shell switches areas via the header nav menu)
- **Dev URL:** `http://localhost:5173/dashboard/` · proxies API to the server (`VITE_PROXY_TARGET`)

## The areas

| Area          | Path (`src/components/`) | What it is                                                                                                                                                                  |
| ------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Chat**      | `chat/`                  | The main stage: conversation header, exchange list, prompt action bar, right panel, floating player, compact view, toolbar. See **2.2**.                                    |
| **SysCtl**    | `sysctl/`                | System control: provider configuration, preprocessing settings, search-engines (Serper + YouTube tools), system health, tab visibility, widgets, per-session model/config management. |
| **DLQ**       | `dlq/`                   | Dead-letter management: list of failed envelopes (polled every 30 s), detail view with payload editing, reinstatable back into the queue.                                   |
| **PProc**     | `pproc/`                 | Image preprocessing workbench: tools panel with file preview pipeline to inspect what variants the server will generate.                                                    |
| **App shell** | `app/`                   | Header (nav menu, tabs), footer, theme selector, main content switch.                                                                                                       |
| **Widgets**   | `widgets/`               | Reusable floating UI: popout preview, toast system.                                                                                                                         |

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

## Environment

| Variable            | Meaning                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `VITE_API_URL`      | REST base (default dev proxy `/api`)                              |
| `VITE_SOCKET_URL`   | Socket.IO endpoint (`http://localhost:3000`)                      |
| `VITE_PROXY_TARGET` | Vite dev-server proxy target (`http://server:3000` in containers) |

## Related pages

- **2.1** — component/store architecture and conventions
- **2.2** — the chat experience in depth
- **2.3** — theming and color identity
