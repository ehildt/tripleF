# 1. Server Overview

The 3F server is a **NestJS 11 application on Fastify 5** with URI versioning (`/api/v1`) and first-class Swagger documentation. It owns the conversation surface: REST intake, the harness queue worker, real-time streaming, and workbench persistence. Long-term memory is deliberately factored out into a second NestJS process, the **memory app** (`apps/memory`, port 3400) — the server talks to it over HTTP (`MEMORY_URL`, via the `memory-client` module) and hands it background jobs over the shared BullMQ `vectorize` queue. See **1.7**.

- **Entry:** `apps/server/src/main.ts` → `apps/server/src/main.module.ts`
- **Dev port:** `3000` · **API base:** `/api/v1` · **Docs:** `/api-docs` (OpenAPI JSON at `/api-docs-json`)
- **Config:** Joi-validated environment via `@triplef/config-factory`, typed `*ConfigService` classes per subsystem

## Boot sequence

1. Fastify adapter created with configurable `bodyLimit`.
2. `NestFactory.create(MainModule)` with a Pino logger (`PinoLoggerService`).
3. `fastifyMultipart` + `@fastify/compress` registered (image intake, bandwidth).
4. CORS enabled from env (`CORS_*`).
5. URI versioning enabled with default version `v1`.
6. Swagger document built and mounted when `ENABLE_SWAGGER=true`.
7. Socket.IO attaches through `@triplef/socketio` (`SocketIOModule`).
8. Uncaught exceptions / unhandled rejections are funnelled into the Nest logger instead of killing the process silently.

## Module map

| Module (`src/modules/…`) | Responsibility                                                                                                                                                                                                     |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `harness`                | **The conversation engine** — REST intake, BullMQ producer/consumer, dependency-driven step engine (interpret → execute → sanitize → respond → memoryWrite → memoryProfile → vectorize), structured-output validation, streaming, cancellation. See **1.2**. |
| `memory-client`          | HTTP client to the memory app (`MEMORY_URL`): memory search/remember calls for the harness and the memory health indicator; feature-gated by `MEMORY_ENABLED`. See **1.7**.                                           |
| `ai-sdk`                 | Vercel AI SDK integration: Ollama provider config (`OLLAMA_HOST`, keep-alive, timeouts, `OLLAMA_API_KEY`), model catalog (`OllamaModelsService`), warm-up, the ollama-overrides API, and the EODHD tool family. Shared tool factories (Serper, Bright Data, YouTube, web fetch, memory) come from `@triplef/agent` — see **12-agent**. |
| `bullmq`                 | Queue connection/defaults (KeyDB), retry/backoff config, queue observability controller, job logger via `@triplef/bullmq-logger`. Registers `HARNESS_QUEUE` (consumed here) and `VECTORIZE_QUEUE` (produced here, consumed by the memory app).                                                                            |
| `dead-letter`            | Persisted dead-letter queue (Prisma → PostgreSQL, `DeadLetterJob` table): failed envelopes with payloads, editable and re-instatable. Lifecycle service with retention pruning (`DLQ_*` envs).                                                                                  |
| `socket-io`              | Socket.IO gateway config, room emission service, cancellation signal. See **1.4**.                                                                                                     |
| `persistence`            | Prisma client module (generated client under `src/generated/`) + conversation/config/playlist controllers.                                                                                                                                                    |
| `minio`                  | S3 storage for user image payloads, bucket lifecycle, job reinstatement on startup (re-queues interrupted jobs after a crash/restart).                                                                             |
| `sharp`                  | Image preprocessing (variant generation with sharp). Dashboard overrides pushed via config endpoint.                                                                                                               |
| `provider-overrides`     | Runtime overrides of provider behaviour (settings-managed; Serper, Bright Data, EODHD, YouTube, sources).                                                                                                              |
| `stock-data`             | Provider-agnostic end-of-day market history: Postgres cache + coverage ledger, gap backfill from the configured provider (EODHD), locally computed technical indicators, REST endpoints. See **1.1** / **1.5**.      |
| `playwright-mcp`        | Headless-chromium MCP sidecar client: connects to the `playwright-mcp` compose service and merges `browser_*` automation tools into the harness tool set (allow-list enforced). See **1.2**.                          |
| `secrets`                | AES-256-GCM cipher for provider API keys at rest (`TRIPLEF_SECRETS_KEY`, with `TRIPLEF_SECRETS_KEY_PREVIOUS` for rotation). See **1.5**.                                                                                                                             |
| `pino-logger`            | Central structured logging (pretty in dev, JSON in prod).                                                                                                                                                          |
| `health`                 | Terminus probes: memory, disk, PostgreSQL indicator, MinIO indicator — plus Ollama ping and the memory-app indicator on readiness.                                                                                                                                              |

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
        │ post-response: memory recall/write + profile via the memory app
        │ (HTTP); fact extraction enqueued as `vectorize` jobs (KeyDB),
        │ executed by the memory app's worker (see 1.7)
        │ failure → DeadLetterJob record (see 1.3)
```

A request therefore has **two results**: the synchronous `202` carrying the realtime coordinates, and the asynchronous event stream on the room.

## Configuration stack

Every subsystem reads through a typed `ConfigService` (Joi schemas at startup — invalid env fails fast). Groups in `apps/server/.env.example`: server base, logger, health thresholds, CORS, Socket.IO, BullMQ (connection/TLS/job options/backoff/logger), Ollama (+ stream timeouts, smooth stream), Postgres, memory client (`MEMORY_URL` + `MEMORY_ENABLED`), harness budgets (`NUM_CTX`, `HARNESS_*` source/reference caps), Serper (all tool families), Bright Data (SERP + Web Unlocker), YouTube (Data API v3), EODHD, sources policy, MinIO/sharp (incl. `PPROC_*` preprocessing defaults), DLQ retention (`DLQ_*`), Playwright MCP, and the secrets cipher. Nothing is read ad-hoc from `process.env` in feature code. How these baselines interact with runtime overrides — and what each knob changes — is the subject of **1.8**.

## Error-handling strategy

- **Validation layer:** DTOs + pipes reject malformed requests (`400`); missing `x-harness-llm` is a hard `400` before a job exists.
- **Job layer:** BullMQ attempts/backoff; terminal failures are copied into the `DeadLetterJob` table with full context instead of vanishing.
- **Stream layer:** model/tool errors are converted into `error` events on the room so the dashboard can render them inline.
- **Ops layer:** `/health/ready` only reports ready when the dependencies answer (disk, process memory, Ollama ping, PostgreSQL, MinIO, and the memory app) — suitable for load-balancer probes. `/health/live` is a trivial always-200 liveness.

## Cross-cutting packages

The server builds on several packages maintained alongside this project: `@triplef/bullmq` (queue module), `@triplef/bullmq-logger`, `@triplef/config-factory`, `@triplef/core-logger`, `@triplef/socketio`, `@triplef/ai-sdk`, `@triplef/agent` (shared structured-output schemas, prompts, and tool factories), `ollama-ai-provider-v2`, and `@triplef/helpers` (bootstrap utilities like `getBodyLimit`).
