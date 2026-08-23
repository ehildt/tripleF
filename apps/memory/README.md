# tripleF (3F) — memory app

The outsourced Qdrant/vector-memory service of the tripleF monorepo. It owns
everything memory-shaped:

- **Qdrant storage** — collections, point CRUD, semantic search (REST 6333)
- **The vectorize pipeline** — the BullMQ worker for the shared `vectorize`
  queue: fact extraction → embedding → storage, plus the cognition-write and
  cognition-profile jobs
- **The memory REST surface** — `/api/v1/qdrant/*` and `/api/v1/memory-overrides/*`
  (the main server proxies these for the dashboard)
- **Cognition state** — the AI's structured understanding-of-the-user document

The main server (`../server`) enqueues vectorize jobs on the shared BullMQ
queue (KeyDB) and calls the sync read/write endpoints over HTTP
(`MemoryClientService`).

## Why a separate app

The memory pipeline (embedding + LLM extraction, every turn) is the heaviest
background load. Running it in its own process isolates it from the chat
serving path, allows independent scaling/restart, and keeps Qdrant access out
of the server.

## Architecture

```
server ──HTTP──▶ memory (this app) ──REST──▶ qdrant:6333
   │                  │
   └── BullMQ ────────┘ (shared `vectorize` queue on KeyDB; server produces,
                        memory runs the VectorizeProcessor worker)
```

- **Shared database**: the `memory_cognition_profile` and
  `harness_provider_override` tables live in the main server's Postgres. The
  **server owns the Prisma schema and migrations** — this app only generates a
  client (`prisma generate`, never `prisma migrate`) against those tables.
- **Shared DLQ**: vectorize job failures are recorded in `dead_letter_job`
  (same table the server's DLQ UI reads).
- **Config**: env is shared with the server (`MEMORY_ENABLED`, `QDRANT_*`,
  `OLLAMA_*`, `POSTGRES_URL`, `BULLMQ_*`). The app listens on `PORT` (default
  3400 in compose).

## Local development

Compose runs the app with hot reload (bind mount), same as the server:

```bash
docker compose -f infra.compose.yml up -d   # postgres, minio, keydb, qdrant
docker compose up                           # server + memory + dashboard
```

Standalone:

```bash
pnpm install
pnpm run db:generate   # prisma client against the shared schema subset
pnpm run start:dev
```

## Quality gates

Same tooling as the server (ESLint, Vitest, dependency-cruiser, depcheck).
No migrations are run here — schema changes to the shared tables are owned by
`server/prisma`.
