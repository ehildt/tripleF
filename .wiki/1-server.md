# 1. Server Overview

The 3F server is a **NestJS 11 application on Fastify 5** with URI versioning (`/api/v1`) and first-class Swagger documentation. One process handles everything: REST intake, queue processing, real-time streaming, and persistence.

- **Entry:** `server/src/main.ts` → `server/src/main.module.ts`
- **Dev port:** `3000` · **API base:** `/api/v1` · **Docs:** `/api-docs` (OpenAPI JSON at `/api-docs-json`)
- **Config:** Joi-validated environment via `@triplef/config-factory`, typed `*ConfigService` classes per subsystem

## Boot sequence

1. Fastify adapter created with configurable `bodyLimit`.
2. `NestFactory.create(MainModule)` with a Pino logger (`PinoLoggerService`).
3. `fastifyMultipart` + `@fastify/compress` registered (image intake, bandwidth).
4. CORS enabled from env (`CORS_*`).
5. URI versioning enabled with default version `v1`.
6. Swagger document built and mounted when `ENABLE_SWAGGER=true`.
7. Socket.IO attaches through `@ehildt/nestjs-socket.io` (`SocketIOModule`).
8. Uncaught exceptions / unhandled rejections are funnelled into the Nest logger instead of killing the process silently.

## Module map

| Module (`src/modules/…`) | Responsibility                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `harness`                | **The conversation engine** — REST intake, BullMQ producer/consumer, step engine (sanitize → interpret → execute → respond), prompts, structured-output schemas, streaming, cancellation. See **1.2**. |
| `ai-sdk`                 | Vercel AI SDK integration: Ollama provider config (`OLLAMA_HOST`, keep-alive, timeouts, `OLLAMA_API_KEY`), model catalog (`OllamaModelsService`), tool selection (`ToolSelectionService`), Serper, Bright Data and YouTube tools.  |
| `bullmq`                 | Queue connection/defaults (KeyDB), retry/backoff config, queue observability controller, job logger via `@ehildt/nestjs-bullmq-logger`.                                                                            |
| `dead-letter`            | Persisted dead-letter queue (Prisma → PostgreSQL): failed envelopes with payloads, editable and re-instatable. Lifecycle service.                                                                                  |
| `socket-io`              | Socket.IO gateway config, room emission service (`emitToRoom`, `emitToAll`), cancellation signal. See **1.4**.                                                                                                     |
| `persistence`            | Prisma client module (generated client under `src/generated/`).                                                                                                                                                    |
| `minio`                  | S3 storage for user image payloads, bucket lifecycle, job reinstatement on startup (re-queues interrupted jobs after a crash/restart).                                                                             |
| `sharp`                  | Image preprocessing (variant generation with sharp). Dashboard overrides pushed via config endpoint.                                                                                                               |
| `provider-overrides`     | Runtime overrides of provider behaviour (sysctl-managed; Serper, Bright Data, EODHD, YouTube, layouts).                                                                                                              |
| `stock-data`             | Provider-agnostic end-of-day market history: Postgres cache + coverage ledger, gap backfill from the configured provider (EODHD), locally computed technical indicators, REST endpoints. See **1.1** / **1.5**.      |
| `playwright-mcp`        | Headless-chromium MCP sidecar client: connects to the `playwright-mcp` compose service and merges `browser_*` automation tools into the harness tool set (deny-list enforced). See **1.2**.                          |
| `secrets`                | AES-256-GCM cipher for provider API keys at rest (`TRIPLEF_SECRETS_KEY`). See **1.5**.                                                                                                                             |
| `pino-logger`            | Central structured logging (pretty in dev, JSON in prod).                                                                                                                                                          |
| `health`                 | Terminus probes: memory, disk, PostgreSQL indicator, MinIO indicator.                                                                                                                                              |

## Request lifecycle (happy path)

```
Dashboard ─POST /api/v1/harness(multipart)─▶ HarnessController
    prompt[] + images + x-harness-llm header + query(requestId, sessionId,
    conversationId, roomId, stream, numCtx, event, think, sessionMetadata…)
        │ validate DTOs, log intake (HarnessStepLogger)
        │ upload image parts, build job envelope
        ▼
HarnessQueueService.emit ─▶ BullMQ / KeyDB ─▶ 202 Accepted
    { realtime: { event, roomId, requestId } }
        │
        ▼ (worker)
HarnessProcessor ─▶ step engine ─▶ Ollama (+ tools)
        │ emits progress/results
        ▼
Socket.IO room (roomId) ─▶ dashboard exchange UI (live tokens)
        │
        ▼
HarnessConversation + HarnessConfig persisted (Prisma)
        │ failure → HarnessDlq record (see 1.3)
```

A request therefore has **two results**: the synchronous `202` carrying the realtime coordinates, and the asynchronous event stream on the room.

## Configuration stack

Every subsystem reads through a typed `ConfigService` (Joi schemas at startup — invalid env fails fast). Groups in `server/.env.example`: server base, logger, health thresholds, CORS, Socket.IO, BullMQ (connection/TLS/job options/backoff/logger), Ollama (+ stream timeouts, smooth stream), Postgres, Serper (all tool families), Bright Data (SERP + Web Unlocker), YouTube (Data API v3), MinIO/sharp. Nothing is read ad-hoc from `process.env` in feature code.

## Error-handling strategy

- **Validation layer:** DTOs + pipes reject malformed requests (`400`); missing `x-harness-llm` is a hard `400` before a job exists.
- **Job layer:** BullMQ attempts/backoff; terminal failures are copied into `HarnessDlq` with full context instead of vanishing.
- **Stream layer:** model/tool errors are converted into `error` events on the room so the dashboard can render them inline.
- **Ops layer:** `/health/ready` only reports ready when Postgres and MinIO answer (besides memory/disk) — suitable for load-balancer probes.

## Cross-cutting packages

The server builds on several `@ehildt/*` packages maintained alongside this project: `@ehildt/nestjs-bullmq` (queue module), `@ehildt/nestjs-bullmq-logger`, `@triplef/config-factory`, `@ehildt/nestjs-ollama`, `@ehildt/nestjs-socket.io`, and `@triplef/helpers` (bootstrap utilities like `getBodyLimit`).
