# 0. Introduction: What is tripleF?

**tripleF** (`{fff}`) — short for _fkoff_ — is an open-source **agentic AI workbench**. It is a direct answer to the proprietary chat platforms: same ambition, no lock-in, no meter running on your own hardware. Every capability is built on free, open-source models that run **fully locally** — or, when you want more headroom, on **Ollama Cloud** models. Your conversations, images, and tooling stay under your control either way.

tripleF is early in development and unapologetic about aiming for the top of the open-source community. It already ships a complete chat experience — including features some proprietary chats still miss — and it is designed as a platform, not a demo.

## What {fff} does today

- **Full chat experience** — multi-image conversations, streaming answers rendered live, reasoning/thinking areas that show the model's chain of thought, session-scoped conversation history, and conversation **compaction** that compresses long threads into a context-efficient summary without losing the plot.
- **Local-first inference** — every request is served by Ollama. Point `OLLAMA_HOST` at your own machine for fully-offline operation, or set `OLLAMA_API_KEY` to use Ollama Cloud models. The workbench treats both as one continuum.
- **Agentic harness** — requests flow through a deterministic step engine: sanitize → interpret → execute → respond. The harness classifies intent, selects tools (web/image/news/shopping/video/review search via Serper, webpage fetch), enforces structured output schemas, and validates responses before they reach the UI.
- **Structured vision & media answers** — describe, compare, OCR, imagine, news, article, product, image/video list schemas turn image understanding into machine-readable, UI-renderable results instead of plain text blobs.
- **Real-time by construction** — answers stream token-by-token over Socket.IO rooms; a request can be **cancelled mid-flight** by the user, and the worker honours the cancellation token at step boundaries.
- **Operability built in** — BullMQ queues with retry/backoff, a persisted dead-letter queue (replay, edit, re-instate), queue and system health consoles, provider-override management, and image preprocessing controls — all exposed in the dashboard's SysCtl area.

## Roadmap

The trajectory is deliberately aggressive:

- **Speech-to-text** input
- **Music and image generation** alongside understanding
- **Provider integrations** — YouTube, messengers, finance, and other everyday data sources
- Anything the proprietary incumbents ship — shipped here, open, first.

## System Overview

```
                      ┌──────────────────────────────────────────────┐
                      │                DASHBOARD (Vue 3)             │
                      │  Chat · SysCtl · DLQ · PProc · Themes        │
                      └───────────────▲───────────────┬──────────────┘
                        Socket.IO     │               │ REST (Fastify,
                        (rooms)       │               │ /api/v1, Swagger)
                      ┌───────────────┴───────────────▼──────────────┐
                      │              SERVER (NestJS + Fastify)       │
                      │                                              │
                      │  Harness controller ──▶ BullMQ harness queue │
                      │                              │               │
                      │                     Harness processor        │
                      │              step engine: sanitize →         │
                      │      interpret → execute → respond           │
                      │         │              │          │          │
                      │  Ollama/AI SDK   Serper tools   Schemas      │
                      └─────┬──────────┬──────────┬──────────┬───────┘
                            │          │          │          │
                     ┌──────▼───┐ ┌────▼─────┐ ┌──▼───────┐ ┌▼────────┐
                     │ KeyDB    │ │ Postgres │ │  MinIO   │ │ Ollama  │
                     │ (queues, │ │ (Prisma: │ │ (image   │ │ (local  │
                     │ sockets) │ │ convos,  │ │ payloads)│ │ /cloud) │
                     │          │ │ DLQ,     │ │          │ │         │
                     │          │ │ config)  │ │          │ │         │
                     └──────────┘ └──────────┘ └──────────┘ └─────────┘
```

## Technology Matrix

| Layer          | Technology                                                  | Role                                                    |
| -------------- | ----------------------------------------------------------- | ------------------------------------------------------- |
| API runtime    | NestJS 11 + Fastify 5                                       | HTTP, versioning, multipart intake, Swagger             |
| Agent stack    | Vercel AI SDK 6 + Ollama                                    | Model calls, tool loop, streaming                       |
| Inference      | Ollama (local or Ollama Cloud)                              | Vision-LLM inference + embeddings                       |
| Async          | BullMQ + KeyDB (Redis-compatible)                           | Job queue, retries, cancellation tokens, socket pub/sub |
| Persistence    | PostgreSQL 16 + Prisma 7                                    | Conversations, dead-letter records, system config       |
| Object storage | MinIO (S3 API)                                              | Image payloads per session/conversation                 |
| Real-time      | Socket.IO 4                                                 | Result streaming rooms, cancellation, events            |
| Frontend       | Vue 3 + Vite 8, Pinia, TanStack Query, Tailwind v4          | Workbench UI                                            |
| Tooling        | pnpm workspaces, TypeScript, Vitest, ESLint, Docker Compose | Monorepo ergonomics                                     |

## Repository Layout

```
triplef.io/
├── server/                  # {fff} server (NestJS + Fastify)
│   ├── src/modules/         # harness, ai-sdk, bullmq, dead-letter, minio,
│   │                        # persistence, sharp, socket-io, provider-overrides ...
│   ├── prisma/              # schema: HarnessConversation, HarnessDlq, HarnessConfig
│   └── Dockerfile           # standalone image (kept for a potential repo split)
├── dashboard/               # {fff} dashboard (Vue 3 + Vite)
│   ├── src/components/      # chat, sysctl, dlq, pproc, app shell, widgets
│   └── Dockerfile           # standalone image (kept for a potential repo split)
├── Dockerfile               # canonical monorepo image (all targets)
├── compose.yml              # dev stack: deps + server + dashboard
├── infra.compose.yml        # postgres, keydb, minio (ollama/searxng optional)
└── .wiki/                   # this documentation
```

## License & Ownership

MIT-licensed. Built with [AI-assisted context coding](3-ai-assisted-development.md) — every architectural decision reviewed and owned by humans.
