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

## Navigation

| Document                                                  | Concern                                        | Key Sections                                                           |
| --------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------- |
| [0-introduction](0-introduction.md)                       | Mission, feature set, roadmap, system overview | Why 3F, architecture diagram, technology matrix                     |
| [0.1-quick-start](0.1-quick-start.md)                     | From clone to running stack                    | Prerequisites, environment, first run, verification                    |
| [0.2-docker](0.2-docker.md)                               | Image design, compose topology, install model  | Root Dockerfile targets, `deps` service, pnpm regimes, troubleshooting |
| [0.3-documentation](0.3-documentation.md)                 | Wiki conventions, badge automation             | Writing docs, depbadge workflow, regenerating badges                   |
| [1-server](1-server.md)                                   | Entry point, module graph, configuration stack | Request lifecycle, module table, error strategy                        |
| [1.1-rest](1.1-rest.md)                                   | Endpoint registry and contracts                | Harness endpoints, queue/DLQ/storage/sysctl APIs, health               |
| [1.2-harness](1.2-harness.md)                             | Conversation engine internals                  | Step engine, intents, structured outputs, compaction, cancellation     |
| [1.3-bullmq](1.3-bullmq.md)                               | Job queues, workers, retries                   | Queue topology, processor pipeline, failure modes                      |
| [1.4-socketio](1.4-socketio.md)                           | Real-time streaming                            | Rooms, event contract, cancellation signal                             |
| [1.5-data](1.5-data.md)                                   | PostgreSQL/Prisma, MinIO, KeyDB                | Models, object layout, image preprocessing                             |
| [2-dashboard](2-dashboard.md)                             | Areas and technology                           | Chat, SysCtl, DLQ, PProc — panel map                                   |
| [2.1-architecture](2.1-architecture.md)                   | Vue 3 component and state architecture         | Stores, composables, API layer, conventions                            |
| [2.2-chat](2.2-chat.md)                                   | The chat experience                            | Exchanges, reasoning areas, streaming UX, compaction                   |
| [2.3-theming](2.3-theming.md)                             | Theme system                                   | Theme catalogue, harmony model, tokens                                 |
| [3-ai-assisted-development](3-ai-assisted-development.md) | How this project is built                      | Context coding, ownership, quality gates                               |
| [3.1-market-positioning](3.1-market-positioning.md)       | Where 3F competes                           | Proprietary landscape, local-first advantages, strategy                |
| [4-business-logic](4-business-logic.md)                   | Feature behaviour and their dependencies        | Core loop, media contracts, grounding, trust boundary                   |
