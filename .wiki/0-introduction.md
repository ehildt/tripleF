# 0. Introduction: What is tripleF?

**tripleF** (`3F`) — short for _fkoff_ — is an open-source **agentic AI workbench**. It is a direct answer to the proprietary chat platforms: same ambition, no lock-in, no meter running on your own hardware. Every capability is built on free, open-source models that run **fully locally** — or, when you want more headroom, on **Ollama Cloud** models. Your conversations, images, and tooling stay under your control either way.

tripleF is early in development and unapologetic about aiming for the top of the open-source community. It already ships a complete chat experience — including features some proprietary chats still miss — and it is designed as a platform, not a demo.

## What 3F does today

- **Full chat experience** — multi-image conversations, document uploads (PDF/DOCX converted to page images), streaming answers rendered live, reasoning/thinking areas that show the model's chain of thought, session-scoped conversation history with rename / delete / pin (temporary↔persistent) controls, and a **custom scroll experience** with two per-conversation modes: a vertical carousel that crossfades between full-height sections, or a native continuous scroll.
- **Local-first inference** — every request is served by Ollama. Point `OLLAMA_HOST` at your own machine for fully-offline operation, or set `OLLAMA_API_KEY` to use Ollama Cloud models. The workbench treats both as one continuum.
- **Agentic harness** — requests flow through a deterministic, dependency-driven step engine: interpret → execute → sanitize → respond (→ memory write/profile/vectorize). The harness classifies intent, selects tools (web/image/news/shopping/places/business-reviews/video search via Serper or Bright Data, YouTube Data API video search, EODHD market-data tools, webpage scrape/fetch, and `browser_*` automation via a Playwright MCP sidecar), language-detects results and files foreign-language finds into an international-coverage aside, enforces structured output schemas, and validates responses before they reach the UI.
- **Structured vision & media answers** — describe, compare, OCR, imagine, news, article, product, stock-market, image/video list schemas turn image understanding into machine-readable, UI-renderable results instead of plain text blobs.
- **Semantic memory & knowledge** — a dedicated **memory app** (Qdrant + a BullMQ `vectorize` worker) gives the AI long-term memory: a user fact partition, an evolving cognition profile with insights/episodes/convictions, a constellation link graph (GraphRAG probes), consolidation/reflect/conviction/cluster maintenance sweeps, and a chunked **knowledge encyclopedia** — all inspectable and editable in the dashboard's SysCtl memory section.
- **Real-time by construction** — answers stream token-by-token over Socket.IO rooms; a request can be **cancelled mid-flight** by the user, and the worker honours the cancellation token at step boundaries.
- **Operability built in** — BullMQ queues with retry/backoff, a persisted dead-letter queue (replay, edit, re-instate), queue and system health consoles, provider-override management, and image preprocessing controls — all exposed in the dashboard's SysCtl area.

## System Overview

```
                      ┌──────────────────────────────────────────────┐
                      │                DASHBOARD (Vue 3)             │
                      │  Chat · SysCtl · DLQ · PProc · Memory · ...  │
                      └───────────────▲───────────────┬──────────────┘
                        Socket.IO     │               │ REST (Fastify,
                        (rooms)       │               │ /api/v1, Swagger)
                      ┌───────────────┴───────────────▼──────────────┐
                      │              SERVER (NestJS + Fastify)       │
                      │                                              │
                      │  Harness controller ──▶ BullMQ harness queue │
                      │                              │               │
                      │                     Harness processor        │
                      │              step engine: interpret →        │
                      │      execute → sanitize → respond            │
                      │         │              │          │          │
                      │  Ollama/AI SDK   Serper/BrightData/YouTube   │
                      │   memory-client ── HTTP → memory app         │
                      │   enqueues vectorize jobs (KeyDB)            │
                      └─────┬──────────┬──────────┬──────────┬───────┘
                            ▼          ▼          ▼          ▼
                     ┌──────────┐ ┌──────────┐ ┌───────────────────┐
                     │ KeyDB    │ │ Postgres │ │ MEMORY (NestJS +  │
                     │ (queues, │ │ (Prisma: │ │ Fastify, :3400)   │
                     │ sockets) │ │ convos,  │ │ /qdrant,          │
                     │          │ │ DLQ,     │ │ /encyclopedia,    │
                     │          │ │ config,  │ │ vectorize worker: │
                     │          │ │ memory   │ │ embed/extract/    │
                     │          │ │ graphs)  │ │ store + sweeps    │
                     └──────────┘ └────▲─────┘ └──────┬───────▲────┘
                                      │               │       │
                     ┌───────────┐    │          ┌────▼───────┴────┐     ┌────────────┐
                     │ MinIO     │────┘          │ Qdrant (memory + │     │ Ollama     │
                     │ (images)  │               │ encyclopedia)    │     │ (local/    │
                     └───────────┘               └──────────────────┘     │ cloud)     │
                                                                           └────────────┘
```

## Technology Matrix

| Layer          | Technology                                                  | Role                                                    |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| API runtime    | NestJS 11 + Fastify 5                                       | HTTP, versioning, multipart intake, Swagger             |
| Agent stack    | Vercel AI SDK 7 + `@triplef/agent`                          | Model calls, tool loop, streaming, shared schemas/prompts/tools |
| Inference      | Ollama (local or Ollama Cloud)                              | Vision-LLM inference + embeddings                       |
| Async          | BullMQ + KeyDB (Redis-compatible)                           | Job queues, retries, cancellation tokens, socket pub/sub |
| Persistence    | PostgreSQL 16 + Prisma 7                                    | Conversations, dead-letter records, system config, memory ledgers/graphs |
| Object storage | MinIO (S3 API)                                              | Image payloads per session/conversation                 |
| Vector store   | Qdrant (`@qdrant/js-client-rest`)                           | Semantic memory + encyclopedia vectors                  |
| Real-time      | Socket.IO 4                                                 | Result streaming rooms, cancellation, events            |
| Frontend       | Vue 3 + Vite 8, Pinia, TanStack Query, Tailwind v4          | Workbench UI                                            |
| Tooling        | pnpm workspaces, TypeScript, Vitest, ESLint, Docker Compose | Monorepo ergonomics                                     |

## Repository Layout

```
triplef.io/
├── apps/
│   ├── server/              # 3F server (NestJS + Fastify) — the harness
│   │   ├── src/modules/     # harness, memory-client, ai-sdk, bullmq, dead-letter,
│   │   │                    # minio, persistence, sharp, socket-io, stock-data,
│   │   │                    # provider-overrides, playwright-mcp, secrets ...
│   │   ├── prisma/          # owns the shared schema: HarnessConversation, HarnessConfig,
│   │   │                    # HarnessShownMedia, HarnessProviderOverride, HarnessPlaylist,
│   │   │                    # DeadLetterJob, StockMarket*, Memory* (ledgers/links/frictions/clusters)
│   │   └── Dockerfile       # standalone image (kept for a potential repo split)
│   ├── memory/              # memory app (NestJS + Fastify) — Qdrant/encyclopedia REST
│   │   ├── src/modules/     # qdrant, encyclopedia, bullmq (vectorize worker), persistence,
│   │   │                    # dead-letter, ai-sdk, secrets, postgres
│   │   └── prisma/          # client against the server's shared tables
│   └── dashboard/           # 3F dashboard (Vue 3 + Vite)
│       ├── src/components/  # chat, sysctl, dlq, pproc, app shell, widgets
│       └── Dockerfile       # standalone image (kept for a potential repo split)
├── packages/                # published libraries: helpers, config-factory, core-logger,
│                            # bullmq, bullmq-logger, socketio, ai-sdk, agent
├── Dockerfile               # canonical monorepo image (all targets)
├── compose.yml              # dev stack: deps + server + memory + dashboard
├── compose.prod.yml         # production stack (prod targets, nginx dashboard)
├── infra.compose.yml        # postgres, keydb, minio, qdrant, playwright-mcp (ollama commented)
└── .wiki/                   # this documentation
```

## License & Ownership

MIT-licensed. Built with [AI-assisted context coding](3-ai-assisted-development.md) — every architectural decision reviewed and owned by humans.
