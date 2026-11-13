# Agent Behavior

- Do **not** use generated scripts, one-off automation, or custom tooling to bulk-modify the codebase without explicit user approval. Prefer manual, reviewable edits or project-native tooling (skills, linters, formatters).
- Do **not** implement workarounds, shortcuts, or brittle hacks to bypass a proper solution. If the correct implementation requires more effort, architecture, or user input, do the correct implementation.
- Do **not** introduce custom implementations, abstractions, or project-wide conventions without first proposing them to the user and getting explicit approval. Prefer the patterns and tooling already present in the codebase.
- Do **not** be lazy. Fully implement the requested behavior — type safety, edge cases, and cleanup — without waiting to be prompted for each step. (Tests, stories, and browser automation are the exception: they require explicit user consent — see below.)
- Do **not** run git commands that modify the repository tree (e.g. `git checkout`, `git reset`, `git commit`, `git rebase`, `git merge`, `git cherry-pick`, `git stash`, or any destructive reset). Read-only git commands such as `git status`, `git log`, or `git diff` are acceptable when needed.
- Do **not** argue with the user. Focus on the current request and move forward; pre-existing errors are treated as leftover context from prior sessions.

## Tests, Stories & Browser Automation

- **Never create `.spec.ts`, `.test.ts`, or `.stories.ts` files, or use `browser_*` tools, without explicit user consent.** Do not add them speculatively or as a "while I'm here" step; ask first.
- **Existing tests are a regression net.** After changing code, run the existing test suite that covers the touched area and report failures.
- **Tests are a contract, not infallible.** They document how the code worked when written; code and tests can drift. A failing test is not automatically proof the code is wrong, and a passing test is not automatically proof the code is right — investigate rather than blindly trusting either side.
- **When a change would break a test, stop and report before fixing.** If extending a function, service, controller, module, or other unit would break an existing test, communicate this to the user before modifying either the code or the test.

# Skills Authoring

- **Skill files contain no code examples — ever.** Skills (`SKILL.md` and any companion guide files) are written in prose only: state the rule, the convention, and the reason. Never include fenced code blocks, code snippets, or copy-paste samples in a skill. If a structure or shape matters, describe it in words (names, ordering, placement, file naming). Inline references to a command name or identifier inside prose (e.g. `pnpm lint`) are fine — the ban is on sample code you could copy-paste. This rule is absolute.

# Technology Guidance

Available domain skills collectively describe the project's technology stack. They are independently supplied guidance, not dependencies of these agent rules. Apply whatever domain guidance is available; when none applies, consult official documentation and the codebase directly. This document does not maintain a registry or require particular skill installations.

# Development Environment

This project uses [Docker Compose](https://docs.docker.com/compose/) for local development with bind-mounted source volumes, providing hot reload for the backend (`./apps/server`), memory app (`./apps/memory`), and frontend (`./apps/dashboard`).

- Create each application's environment file from its committed example before the first start: server, memory, and dashboard. Leave existing environment files untouched unless explicitly asked to modify them.
- Install dependencies from the repository root with `pnpm install`.
- Start backing services with `docker compose -f infra.compose.yml up -d --wait`, push the server-owned Prisma schema with `pnpm --filter @triplef/server db:push`, then use `docker compose up` (or `docker compose up -d`) to start the app stack. The memory app never owns schema migration.
- The app and infra Compose files share one project. Do **not** use `--remove-orphans` during routine split-file startup: each file would otherwise remove the other file's containers as orphans.
- Do **not** instruct the user to rebuild images or restart containers when making code changes to `apps/server`, `apps/memory`, or `apps/dashboard`; the running containers pick up edits automatically via volume mounts.
- Only suggest a rebuild (`docker compose build`) or a restart when:
  - `Dockerfile` or `package.json` dependency changes are made,
  - Infra services in `infra.compose.yml` change, or
  - The running container is actually stale for a confirmed reason.
- RustFS runs as a non-root user. Mount its named volume directly at `/data`, retain the explicit `/health/ready` healthcheck, and validate readiness plus a representative S3 operation after object-storage infrastructure changes. A nested mount point can be created with root ownership and prevent startup.
- Treat Compose startup and storage readiness as operational checks: verify infrastructure health and a representative operation rather than assuming that a running container is usable.

# Package Publishing Workflow

The `packages/*` libraries are published to npm and consumed by the apps via published semver ranges — **not** `workspace:*`.

- When a package's public API changes, publish the new version **first**, then update the apps' `package.json` dependency range and imports.
- Do **not** use `workspace:*` in the apps' `package.json`; the apps resolve published versions from the registry.
- To verify app changes against an unpublished package locally, temporarily link the workspace package, verify, then revert to the published range before the user publishes.

# Planning Protocol

Before proposing or implementing any non-trivial change, the agent must:

1. **Investigate and research online.** Use `web_search` and `web_fetch` to consult the official documentation and current best practices for every relevant technology in the change. Do not rely on memory or assumptions when an authoritative, up-to-date source is available.
2. **Formulate a clear plan.** Summarize findings, the intended approach, affected files, and any trade-offs or open questions. Apply the senior-engineer review from `AGENTS.md` § Senior Engineering Counsel: if a materially better or simpler path exists, challenge the idea plainly before planning around it.
3. **Prompt the user for explicit go-ahead.** Do not begin implementation until the user confirms the plan with an explicit response such as "go", "approved", "yes", or similar. Read-only exploration, file reading, and planning itself are allowed before confirmation; code edits and command execution that modify the project are not.
4. **Restate the question on investigated plan replies.** When presenting a plan after investigation or extended reasoning, put the user's original question at the top of the reply, quoted or closely restated, before the findings and plan. This keeps the reply understandable when the user returns hours later or resumes the session on another day.

# Implementation Guidelines

- Base implementations on documented APIs and recommended patterns.
- Do not rely on assumptions, outdated knowledge, or undocumented behavior when a documented source is available.
- When introducing new code, ensure it aligns with the framework's current best practices and conventions.
- If multiple technologies are involved, review the documentation for each relevant technology before proceeding.
- When documentation and existing code conflict, verify the intended behavior and follow the documented approach unless there is a project-specific requirement to do otherwise.
- **Check conventions before running the quality gates.** After implementing — and before lint, tests, or Storybook stories — self-review the finished change against the applicable project conventions (folder structure and naming, props types, CSS tokens and BEM, i18n keys, store/composable boundaries) and report any deviations you find. Passing type-check and lint is not proof the conventions were followed.
