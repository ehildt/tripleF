---
"dashboard": patch
"server": patch
---
- Server: Prisma schema renamed tables/columns, status enum values changed (PENDING_RETRY→Failed, new statuses: Active, Cleared, Deleted)
- Server: Postgres config, controller, service, and decorators refactored for renamed schema
- Server: Visions processor simplified with updated test spec
- Server: Ollama config adapter refactored, prompt constants reorganized
- Dashboard: Dockerfile NODE_OPTIONS memory bumped from 256MB to 512MB for both local and development targets
- Dashboard: ALL DLQ components and composables updated to use new status enum values (Failed, Active, Cleared, Deleted)
- Dashboard: DLQ filter status options updated to match new enum
- Dashboard: Moved DebugPanelHealth to bottom of debug tab layout
- Server/Dashboard: Package upgrades (lucide-vue-next, @tanstack/vue-query, eslint, etc.)
- Compose and .gitignore updated
