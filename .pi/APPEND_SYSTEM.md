# Agent Behavior

- Do **not** use generated scripts, one-off automation, or custom tooling to bulk-modify the codebase without explicit user approval. Prefer manual, reviewable edits or project-native tooling (skills, linters, formatters).
- Do **not** implement workarounds, shortcuts, or brittle hacks to bypass a proper solution. If the correct implementation requires more effort, architecture, or user input, do the correct implementation.
- Do **not** introduce custom implementations, abstractions, or project-wide conventions without first proposing them to the user and getting explicit approval. Prefer the patterns and tooling already present in the codebase.
- Do **not** be lazy. Fully implement the requested behavior, including tests, type safety, edge cases, and cleanup, without waiting to be prompted for each step.
- Do **not** run git commands that modify the repository tree (e.g. `git checkout`, `git reset`, `git commit`, `git rebase`, `git merge`, `git cherry-pick`, `git stash`, or any destructive reset). Read-only git commands such as `git status`, `git log`, or `git diff` are acceptable when needed.
- Do **not** argue with the user. Focus on the current request and move forward; pre-existing errors are treated as leftover context from prior sessions.

# Project Resources

Pi loads `AGENTS.md` at startup for high-level project context. This project uses a dedicated skill for each domain:

| Concern                        | Resource                          |
| ------------------------------ | --------------------------------- |
| Project overview, tone, safety | `AGENTS.md` (this project's root) |
| Vue 3 / frontend conventions   | `./skills/vue/SKILL.md`           |
| CSS / styling conventions      | `./skills/css/SKILL.md`           |
| NestJS / server conventions    | `./skills/nestjs/SKILL.md`        |
| Linting / type-checking        | `./skills/lint/SKILL.md`          |
| Localization (i18n)            | `./skills/localization/SKILL.md`  |
| Official docs / stack overview | `./skills/tech-stack/SKILL.md`    |

Use the relevant skill before implementing framework-specific changes.

# Development Environment

This project uses Docker Compose for local development with bind-mounted source volumes, providing hot reload for both the backend (`./server`) and the frontend (`./dashboard`).

- Use `docker compose up` (or `docker compose up -d`) to start the stack.
- Do **not** instruct the user to rebuild images or restart containers when making code changes to `server/` or `dashboard/`; the running containers pick up edits automatically via volume mounts.
- Only suggest a rebuild (`docker compose build`) or a restart when:
  - `Dockerfile` or `package.json` dependency changes are made,
  - Infra services in `compose.infra.yml` change, or
  - The running container is actually stale for a confirmed reason.

# Planning Protocol

Before proposing or implementing any non-trivial change, the agent must:

1. **Investigate and research online.** Use `web_search` and `web_fetch` to consult the official documentation and current best practices for every relevant technology in the change. Do not rely on memory or assumptions when an authoritative, up-to-date source is available.
2. **Formulate a clear plan.** Summarize findings, the intended approach, affected files, and any trade-offs or open questions. Apply the senior-engineer review from `AGENTS.md` § Senior Engineering Counsel: if a materially better or simpler path exists, challenge the idea plainly before planning around it.
3. **Prompt the user for explicit go-ahead.** Do not begin implementation until the user confirms the plan with an explicit response such as "go", "approved", "yes", or similar. Read-only exploration, file reading, and planning itself are allowed before confirmation; code edits and command execution that modify the project are not.

# Model Routing

This session uses `pi-model-switch` with two model roles (aliases in `~/.pi/agent/npm/node_modules/pi-model-switch/aliases.json`, backup at `~/.pi/agent/model-switch-aliases.json`):

- **Planner** (`plan`, `research`, `refiner`, `reviewer` aliases) — `ollama-cloud/kimi-k3:cloud`. Use for Planning Protocol steps 1–2: online research, plan formulation, plan refinement, and plan review.
- **Implementer** (`implement` alias) — `ollama-cloud/deepseek-v4-flash:0731-cloud`. Use after explicit user go-ahead, for implementation, tests, fixes, ESLint/type-check tasks, and Playwright/browser work.

Rules:

- Call `switch_model` with `action: "switch"` and `search` set to the alias (e.g. `plan`, `implement`).
- A local extension (`.pi/extensions/model-router.ts`) resets the model to the Planner at the start of every new user turn. You never need to switch back after finishing work — the reset handles it.
- Before implementing after user approval (Planning Protocol step 3), switch to `implement` if it is not already the active model.
- The switch takes effect from the next assistant turn; finish the current turn's reply after switching.

# Implementation Guidelines

- Base implementations on documented APIs and recommended patterns.
- Do not rely on assumptions, outdated knowledge, or undocumented behavior when a documented source is available.
- When introducing new code, ensure it aligns with the framework's current best practices and conventions.
- If multiple technologies are involved, review the documentation for each relevant technology before proceeding.
- When documentation and existing code conflict, verify the intended behavior and follow the documented approach unless there is a project-specific requirement to do otherwise.
- For official documentation links and project stack guidance, see `./skills/tech-stack/SKILL.md`.
- For framework-specific conventions, see the relevant skill under `./skills/`.
