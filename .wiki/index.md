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

## Navigation

| Document                                                  | Concern                                        | Key Sections                                                           |
| --------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| [0-introduction](0-introduction.md)                       | Mission, feature set, system overview | Why 3F, architecture diagram, technology matrix                     |
| [0.1-quick-start](0.1-quick-start.md)                     | From clone to running stack                    | Prerequisites, environment, first run, verification                    |
| [0.2-docker](0.2-docker.md)                               | Image design, compose topology, install model  | Root Dockerfile targets, `deps` service, pnpm regimes, troubleshooting |
| [0.3-documentation](0.3-documentation.md)                 | Wiki conventions, badge automation             | Writing docs, depbadge workflow, regenerating badges                   |
| [1-server](1-server.md)                                   | Entry point, module graph, configuration stack | Request lifecycle, module table, error strategy                        |
| [1.1-rest](1.1-rest.md)                                   | Endpoint registry and contracts                | Harness endpoints, queue/DLQ/storage/sysctl APIs, health               |
| [1.2-harness](1.2-harness.md)                             | Conversation engine internals                  | Step engine, intents, structured outputs, cancellation     |
| [1.3-bullmq](1.3-bullmq.md)                               | Job queues, workers, retries                   | Queue topology, processor pipeline, failure modes                      |
| [1.4-socketio](1.4-socketio.md)                           | Real-time streaming                            | Rooms, event contract, cancellation signal                             |
| [1.5-data](1.5-data.md)                                   | PostgreSQL/Prisma, MinIO, KeyDB                | Models, object layout, image preprocessing                             |
| [2-dashboard](2-dashboard.md)                             | Areas and technology                           | Chat, SysCtl, DLQ, PProc, router — panel map                                   |
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
| [6-config-factory](6-config-factory.md)                   | `@triplef/config-factory` library overview      | Modules, installation, peer dependencies                                 |
| [6.1-config-factory](6.1-config-factory.md)               | NestJS module for registering config providers | `forRoot` options, global providers, usage                               |
| [6.2-cache-return-value](6.2-cache-return-value.md)       | Decorator caching return values                 | TTL, stale-while-revalidate, Joi validation                              |
| [6.3-validate-return-value](6.3-validate-return-value.md) | Decorator validating return values              | Joi schema validation, `ValidateReturnValueError`                        |
| [6.4-quick-start](6.4-quick-start.md)                     | Using the config-factory package                | Install, config service, module registration                            |
| [7-core-logger](7-core-logger.md)                         | `@triplef/core-logger` library overview         | Modules, installation, peer dependencies                                 |
| [7.1-core-logger-service](7.1-core-logger-service.md)     | NestJS `LoggerService` backed by pino           | Call shapes, onLog hook, setLogLevels                                    |
| [7.2-core-logger-module](7.2-core-logger-module.md)       | Dynamic module wiring the service to pino       | `registerAsync` options, bootstrap                                       |
| [7.3-core-logger-schema](7.3-core-logger-schema.md)       | Joi schema for pino options                     | Fields, validation usage                                                |
| [7.4-quick-start](7.4-quick-start.md)                     | Using the core-logger package                   | Install, config service, register, bootstrap                             |
