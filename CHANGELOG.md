# @ckir.io/visions

## 1.3.0

### Minor Changes

- 2f33ac0: Refactored repository into a monorepo structure with dedicated `/server` and `/dashboard` packages.

  - **Dashboard added** — Introduced a new Vue 3 frontend dashboard in `/dashboard`, built with Vite and Tailwind CSS v4, communicating via Socket.IO for real-time AI image analysis results.
  - **Per-package README files** — Created `server/README.md` and `dashboard/README.md` with `depbadge` integration. Updated `depbadgerc.yml` manifests in both packages to sync with actual `package.json` dependencies and generated fresh dependency/devDependency badges.
  - **Root README updated** — Added a "Monorepo Packages" section referencing the new sub-packages, cleaned up dependency badge lists to reflect actual server packages, and added an **AI GUIDANCE** footer link pointing to the new wiki page.
  - **AI Guidance wiki** — Created `.wiki/ai-guidance.md` explaining the philosophy around AI-assisted development: vibe coding for prototyping, context coding for generation, and the critical need to _own the generated code_ by reading, debugging, and refactoring it. Includes honest disclosure that this project intentionally experiments with AI-generated code without always strictly refactoring to personal standards. References real-world articles on vibe coding technical debt.
  - **Wiki singular voice** — Updated all `.wiki` files from plural/impersonal voice ("we", "our", "team") to singular first-person voice ("I", "my") to accurately reflect solo developer ownership.
  - **Development guide** — Removed contribution guidelines and code of conduct sections from `development.md` as they don't apply to a solo project.

  > **Production Warning** — The AI Guidance page explicitly discourages applying the current AI-heavy, loosely-refactored approach to enterprise or production software, and outlines the stricter standards that would be required in those contexts.

## 1.2.0

### Minor Changes

- d8dd5ff: Rename `batchId` to `requestId` for better semantics

  - Add `requestId` query parameter to REST and MCP endpoints
  - REST endpoint now returns `{ realtime: { event, roomId, requestId } }` response matching MCP
  - Create shared `RealtimeInfo` DTO used by both REST and MCP responses
  - Update Swagger documentation with response schema

### Patch Changes

- 483e519: Sync wiki documentation with source code

  - Fixed incorrect default values in system-environment.md (PORT, NODE_ENV, OLLAMA_KEEP_ALIVE, BULLMQ_JOB_PRIORITY, age values)
  - Removed non-existent SOCKET_IO_PORT from documentation
  - Updated docker-compose.md with correct ports, network name, and volumes
  - Fixed header name casing and error status codes
  - Updated Socket.IO connection URL and MCP tool schema

- 483e519: move AGENTS.md and EXTEND.md to .opencode directory

## 1.1.0

### Minor Changes

- e6d70cd: ## MCP & Wiki Improvements

  ### MCP Fixes

  - Fixed MCP validation to accept `params.name` (MCP spec standard) instead of `params.function`
  - Changed MCP prompt from plain string to `Prompt[]` array format (matches REST API)
  - Updated controller and DTOs to handle both formats correctly

  ### Wiki Updates

  - Added comprehensive REST API documentation with task types: describe, compare, ocr
  - Added MCP documentation with JSON-RPC payload examples for all tools
  - Fixed query parameter documentation (moved `task` from query to body)
  - Added Swagger examples for both REST and MCP endpoints
  - Updated required fields in tool schema from `["images", "prompt", "task"]` to `["task"]`
  - Added complete `.env` example with all variables (optional ones commented)
  - Added compose.yml example with optional GPU support commented

  ### Code Quality

  - Added tests for MCP payload validation including name parameter and Prompt array format
  - Fixed linter errors in validation pipe and DTOs

### Patch Changes

- d18f592: Add tests for improved coverage: config adapters, pipes, and services
