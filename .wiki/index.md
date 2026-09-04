# tripleF (3F) — Technical Wiki

> An agentic AI workbench, fully open source, powered by free models — run everything locally or on Ollama Cloud.

## Table of Contents

### Getting Started

- [0. Introduction: What is tripleF?](0-introduction.md)
- [0.1. Quick Start](0.1-quick-start.md)
- [0.2. Docker: Dockerfiles & Compose](0.2-docker.md)
- [0.3. Documentation & Badges](0.3-documentation.md)

### Server

- [1. Server Overview](1-server.md)
- [1.1. REST API](1.1-rest.md)
- [1.2. The Harness](1.2-harness.md)
- [1.3. BullMQ Async Processing](1.3-bullmq.md)
- [1.4. Socket.IO Real-time Layer](1.4-socketio.md)
- [1.5. Data & Storage](1.5-data.md)
- [1.6. Memory Cognition](1.6-memory-cognition.md)
- [1.7. The Memory App](1.7-memory-app.md)
- [1.8. Runtime Configuration & System Variables](1.8-runtime-configuration.md)

### Dashboard

- [2. Dashboard Overview](2-dashboard.md)
- [2.1. Frontend Architecture](2.1-architecture.md)
- [2.2. The Chat Experience](2.2-chat.md)
- [2.3. Theming & Color Identity](2.3-theming.md)

### Methodology & Positioning

- [3. AI-Assisted Development & Code Ownership](3-ai-assisted-development.md)
- [3.1. Market Positioning](3.1-market-positioning.md)

### Business Logic

- [4. Business Logic: How the Features Work](4-business-logic.md)

### Helpers

- [5. The @triplef/helpers Library](5-helpers.md)
- [5.1. Bootstrap](5.1-bootstrap.md)
- [5.2. Environment Variables](5.2-environment-variables.md)
- [5.3. Find Up](5.3-find-up.md)
- [5.4. Hash Payload](5.4-hash-payload.md)
- [5.5. Is Buffer or Serialized](5.5-is-buffer-or-serialized.md)
- [5.6. Object I/O](5.6-object-io.md)
- [5.7. Text To Lines](5.7-text-to-lines.md)
- [5.8. Quick Start](5.8-quick-start.md)
- [5.9. Retry With Backoff](5.9-retry-with-backoff.md)
- [5.10. Parse LLM JSON](5.10-parse-llm-json.md)
- [5.11. Limit Text](5.11-limit-text.md)
- [5.12. Mask API Key](5.12-mask-api-key.md)
- [5.13. Encrypt Secret](5.13-encrypt-secret.md)
- [5.14. Key Fingerprint](5.14-key-fingerprint.md)

### Config-Factory

- [6. The @triplef/config-factory Library](6-config-factory.md)
- [6.1. Config-Factory Module](6.1-config-factory.md)
- [6.2. Cache Return Value](6.2-cache-return-value.md)
- [6.3. Validate Return Value](6.3-validate-return-value.md)
- [6.4. Quick Start](6.4-quick-start.md)

### Core-Logger

- [7. The @triplef/core-logger Library](7-core-logger.md)
- [7.1. Core-Logger Service](7.1-core-logger-service.md)
- [7.2. Core-Logger Module](7.2-core-logger-module.md)
- [7.3. Core-Logger Schema](7.3-core-logger-schema.md)
- [7.4. Quick Start](7.4-quick-start.md)

### BullMQ

- [8. The @triplef/bullmq Library](8-bullmq.md)
- [8.1. BullMQ Module](8.1-bullmq-module.md)
- [8.2. BullMQ Config Schema](8.2-bullmq-config-schema.md)
- [8.3. Quick Start](8.3-quick-start.md)

### BullMQ-Logger

- [9. The @triplef/bullmq-logger Library](9-bullmq-logger.md)
- [9.1. BullMQ-Logger Service](9.1-bullmq-logger-service.md)
- [9.2. BullMQ-Logger Module](9.2-bullmq-logger-module.md)
- [9.3. BullMQ-Logger Schema](9.3-bullmq-logger-schema.md)
- [9.4. Quick Start](9.4-quick-start.md)

### Socket.IO

- [10. The @triplef/socketio Library](10-socketio.md)
- [10.1. Socket.IO Module](10.1-socket-io-module.md)
- [10.2. Socket.IO Service](10.2-socket-io-service.md)
- [10.3. Socket.IO Schema](10.3-socket-io-schema.md)
- [10.4. Quick Start](10.4-quick-start.md)

### AI SDK

- [11. The @triplef/ai-sdk Library](11-ai-sdk.md)
- [11.1. AI SDK Module](11.1-ai-sdk-module.md)
- [11.2. AI SDK Service](11.2-ai-sdk-service.md)
- [11.3. AI SDK Schema](11.3-ai-sdk-schema.md)
- [11.4. Quick Start](11.4-quick-start.md)

### Agent

- [12. The @triplef/agent Library](12-agent.md)
- [12.1. Agent Schemas](12.1-schemas.md)
- [12.2. Agent Prompts](12.2-prompts.md)
- [12.3. Agent Tools](12.3-tools.md)
- [12.4. Quick Start](12.4-quick-start.md)

## Navigation

| Document                                                  | Concern                                        | Key Sections                                                           |
| --------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| [0-introduction](0-introduction.md)                       | Mission, feature set, system overview | Why 3F, architecture diagram, technology matrix                     |
| [0.1-quick-start](0.1-quick-start.md)                     | From clone to running stack                    | Prerequisites, environment, first run, verification                    |
| [0.2-docker](0.2-docker.md)                               | Image design, compose topology, install model  | Root Dockerfile targets, `deps` service, pnpm regimes, troubleshooting |
| [0.3-documentation](0.3-documentation.md)                 | Wiki conventions, badge automation             | Writing docs, depbadge workflow, regenerating badges                   |
| [1-server](1-server.md)                                   | Entry point, module graph, configuration stack | Request lifecycle, module table, error strategy                        |
| [1.1-rest](1.1-rest.md)                                   | Endpoint registry and contracts                | Harness endpoints, queue/DLQ/storage/settings APIs, health               |
| [1.2-harness](1.2-harness.md)                             | Conversation engine internals                  | Step engine, intents, structured outputs, cancellation     |
| [1.3-bullmq](1.3-bullmq.md)                               | Job queues, workers, retries                   | Queue topology, processor pipeline, failure modes                      |
| [1.4-socketio](1.4-socketio.md)                           | Real-time streaming                            | Rooms, event contract, cancellation signal                             |
| [1.5-data](1.5-data.md)                                   | PostgreSQL/Prisma, MinIO, KeyDB, Qdrant            | Models, object layout, image preprocessing                             |
| [1.6-memory-cognition](1.6-memory-cognition.md)           | Memory cognition JSON schema                   | Profile fields, insights, episodes, merge semantics, system variables   |
| [1.7-memory-app](1.7-memory-app.md)                       | The memory service (Qdrant + vectorize worker + encyclopedia) | Topology, workflow, maintenance pipelines, REST registry |
| [1.8-runtime-configuration](1.8-runtime-configuration.md) | How system variables/configs alter behavior    | The four layers, per-knob behavior tables, effect timing                |
| [2-dashboard](2-dashboard.md)                             | Areas and technology                           | Chat, Settings, DLQ, PProc, router — panel map                                   |
| [2.1-architecture](2.1-architecture.md)                   | Vue 3 component and state architecture         | Stores, composables, API layer, conventions                            |
| [2.2-chat](2.2-chat.md)                                   | The chat experience                            | Exchanges, reasoning areas, streaming UX, conversation controls                   |
| [2.3-theming](2.3-theming.md)                             | Theme system                                   | Theme catalogue, harmony model, tokens                                 |
| [3-ai-assisted-development](3-ai-assisted-development.md) | How this project is built                      | Context coding, ownership, quality gates                               |
| [3.1-market-positioning](3.1-market-positioning.md)       | Where 3F competes                           | Proprietary landscape, local-first advantages, strategy                |
| [4-business-logic](4-business-logic.md)                   | Feature behaviour and their dependencies        | Core loop, media contracts, grounding, trust boundary                   |
| [5-helpers](5-helpers.md)                                 | `@triplef/helpers` library overview             | Modules, installation, peer dependencies                                |
| [5.1-bootstrap](5.1-bootstrap.md)                         | NestJS bootstrap utilities                      | App config schema, validation pipeline, swagger, logging                |
| [5.2-environment-variables](5.2-environment-variables.md) | Env parsing utilities                           | Boolean / number / byte-size parsing                                    |
| [5.3-find-up](5.3-find-up.md)                             | File discovery                                  | Traverse up the tree, read package.json from root                       |
| [5.4-hash-payload](5.4-hash-payload.md)                   | Hashing helpers                                 | SHA-256/384/512, object/buffer support                                  |
| [5.5-is-buffer-or-serialized](5.5-is-buffer-or-serialized.md) | Cross-platform buffer detection             | Buffer, ArrayBuffer, TypedArray, DataView, serialized                   |
| [5.6-object-io](5.6-object-io.md)                         | Object utilities                               | Clone, merge, pick, omit, is-empty                                     |
| [5.7-text-to-lines](5.7-text-to-lines.md)                 | Sentence splitting                              | Western + CJK punctuation, chainable API                                |
| [5.8-quick-start](5.8-quick-start.md)                     | Using the helpers package                       | Install, env parsing, object-io, hashing                                 |
| [5.9-retry-with-backoff](5.9-retry-with-backoff.md)       | Retries with exponential backoff                | Options, jitter, abort, predicates                                       |
| [5.10-parse-llm-json](5.10-parse-llm-json.md)             | Tolerant JSON parsing for model output          | Deviations tolerated, extraction                                          |
| [5.11-limit-text](5.11-limit-text.md)                     | Text capping for LLM payloads                   | Truncation marker behavior                                               |
| [5.12-mask-api-key](5.12-mask-api-key.md)                 | API-key masking                                 | Fixed mask, masked-value detection                                        |
| [5.13-encrypt-secret](5.13-encrypt-secret.md)             | AES-256-GCM secret payloads                     | Payload format, rotation, failure semantics                               |
| [5.14-key-fingerprint](5.14-key-fingerprint.md)           | Key identification                              | Fingerprint + key ring                                                    |
| [6-config-factory](6-config-factory.md)                   | `@triplef/config-factory` library overview      | Modules, installation, peer dependencies                                 |
| [6.1-config-factory](6.1-config-factory.md)               | NestJS module for registering config providers | `forRoot` options, global providers, usage                               |
| [6.2-cache-return-value](6.2-cache-return-value.md)       | Decorator caching return values                 | TTL, stale-while-revalidate, Joi validation                              |
| [6.3-validate-return-value](6.3-validate-return-value.md) | Decorator validating return values              | Joi schema validation, `ValidateReturnValueError`                        |
| [6.4-quick-start](6.4-quick-start.md)                     | Using the config-factory package                | Install, config service, module registration                            |
| [7-core-logger](7-core-logger.md)                         | `@triplef/core-logger` library overview         | Modules, installation, peer dependencies                                 |
| [7.1-core-logger-service](7.1-core-logger-service.md)     | NestJS `LoggerService` backed by pino           | Call shapes, error bindings, setLogLevels                                |
| [7.2-core-logger-module](7.2-core-logger-module.md)       | Dynamic module wiring the service to pino       | `registerAsync` options, bootstrap                                       |
| [7.3-core-logger-schema](7.3-core-logger-schema.md)       | Joi schema for pino options                     | Fields, validation usage                                                |
| [7.4-quick-start](7.4-quick-start.md)                     | Using the core-logger package                   | Install, config service, register, bootstrap                             |
| [8-bullmq](8-bullmq.md)                                   | `@triplef/bullmq` library overview              | Modules, installation, peer dependencies                                 |
| [8.1-bullmq-module](8.1-bullmq-module.md)                 | Dynamic module registering BullMQ queues        | `registerAsync` options, queue registration, per-queue connection        |
| [8.2-bullmq-config-schema](8.2-bullmq-config-schema.md)   | Joi schema for queue config                     | Connection fields, default job options, validation usage                 |
| [8.3-quick-start](8.3-quick-start.md)                     | Using the bullmq package                        | Install, config service, register, inject queue                         |
| [9-bullmq-logger](9-bullmq-logger.md)                     | `@triplef/bullmq-logger` library overview       | Modules, installation, peer dependencies                                 |
| [9.1-bullmq-logger-service](9.1-bullmq-logger-service.md) | NestJS `LoggerService` for BullMQ jobs          | Methods, state icons, safe state inference                               |
| [9.2-bullmq-logger-module](9.2-bullmq-logger-module.md)   | Dynamic module wiring the service to pino       | `registerAsync` options, usage                                           |
| [9.3-bullmq-logger-schema](9.3-bullmq-logger-schema.md)   | Joi schema for pino options (incl. `redact`)    | Fields, validation usage                                                |
| [9.4-quick-start](9.4-quick-start.md)                     | Using the bullmq-logger package                 | Install, config service, register, log a job                            |
| [10-socketio](10-socketio.md)                             | `@triplef/socketio` library overview            | Modules, installation, peer dependencies                                |
| [10.1-socket-io-module](10.1-socket-io-module.md)         | Dynamic module + adapter auto-detection         | `registerAsync` options, `attach()`, usage                               |
| [10.2-socket-io-service](10.2-socket-io-service.md)       | Fluent service for rooms and events             | Methods, chaining, usage                                                 |
| [10.3-socket-io-schema](10.3-socket-io-schema.md)         | Joi schema for server config                    | Fields, validation usage                                                |
| [10.4-quick-start](10.4-quick-start.md)                   | Using the socketio package                      | Install, config service, register, attach, emit                          |
| [11-ai-sdk](11-ai-sdk.md)                                 | `@triplef/ai-sdk` library overview              | Modules, installation, peer dependencies                                |
| [11.1-ai-sdk-module](11.1-ai-sdk-module.md)               | Dynamic module wiring the AI SDK services       | `registerAsync` options, usage                                           |
| [11.2-ai-sdk-service](11.2-ai-sdk-service.md)             | Streaming/generation clients                    | Methods, usage                                                           |
| [11.3-ai-sdk-schema](11.3-ai-sdk-schema.md)               | Joi schema for the AI SDK config                | Fields, validation usage                                                |
| [11.4-quick-start](11.4-quick-start.md)                   | Using the ai-sdk package                        | Install, config service, register, stream                                |
| [12-agent](12-agent.md)                                   | `@triplef/agent` library overview               | Exports map, installation, design notes                                   |
| [12.1-schemas](12.1-schemas.md)                           | Intent/response/memory Zod schemas              | Tool registry, URL trust, clamps                                          |
| [12.2-prompts](12.2-prompts.md)                           | System prompts, instructions, snippets          | Harness + memory prompts, shared fragments                                |
| [12.3-tools](12.3-tools.md)                               | Tool factories                                  | Provider families, memory tools, summaries                                |
| [12.4-quick-start](12.4-quick-start.md)                   | Using the agent package                         | Install, tool DI, schema validation, memory scopes                        |
