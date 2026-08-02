---
"@triplef.io/server": minor
"@triplef.io/dashboard": minor
---

- Server: dead-letter queue module — terminal BullMQ failures copied into the persisted DLQ with full envelope context; editable and re-instatable entries
- Server: DLQ lifecycle service with status flow (failed → active → cleared/deleted), retry with backoff, and event emission
- Server: `/bullmq` live queue status endpoint feeding the queue console; job logger via `@ehildt/nestjs-bullmq-logger`
- Dashboard: complete DLQ panel — list rows with status badges and filters, details body with error/metadata/prompt/payload tabs, payload editor with filter-update mutations, re-instate/retry actions
- Dashboard: DLQ composables for action availability, details state, failure text resolution, payload editing, and loading states
