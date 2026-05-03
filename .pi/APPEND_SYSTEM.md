# Agent Behavior

- Do **not** use generated scripts, one-off automation, or custom tooling to bulk-modify the codebase without explicit user approval. Prefer manual, reviewable edits or project-native tooling (skills, linters, formatters).
- Do **not** implement workarounds, shortcuts, or brittle hacks to bypass a proper solution. If the correct implementation requires more effort, architecture, or user input, do the correct implementation.
- Do **not** introduce custom implementations, abstractions, or project-wide conventions without first proposing them to the user and getting explicit approval. Prefer the patterns and tooling already present in the codebase.
- Do **not** be lazy. Fully implement the requested behavior, including tests, type safety, edge cases, and cleanup, without waiting to be prompted for each step.
- Do **not** run git commands that modify the repository tree (e.g., `git checkout`, `git reset`, `git commit`, `git rebase`, `git merge`, `git cherry-pick`, `git stash`, or any destructive reset). Read-only git commands such as `git status`, `git log`, or `git diff` are acceptable when needed.

# Development Environment

This project uses Docker Compose for local development with bind-mounted source volumes, providing hot reload for both the backend (`./server`) and the frontend (`./dashboard`).

- Use `docker compose up` (or `docker compose up -d`) to start the stack.
- Do **not** instruct the user to rebuild images or restart containers when making code changes to `server/` or `dashboard/`; the running containers pick up edits automatically via volume mounts.
- Only suggest a rebuild (`docker compose build`) or a restart when:
  - `Dockerfile` or `package.json` dependency changes are made,
  - Infra services in `compose.infra.yml` change, or
  - The running container is actually stale for a confirmed reason.

# Tech Stack References

The following official documentation sources should be used whenever implementing features, fixing bugs, refactoring code, or making architecture decisions related to the project's technology stack.

Before implementing anything that involves these technologies, consult the relevant documentation to ensure the solution follows the official APIs, conventions, and current best practices.

## Official Documentation

- **Vue 3**
  https://vuejs.org/guide/introduction.html

- **NestJS**
  https://docs.nestjs.com

- **Node.js**
  https://nodejs.org/docs/latest/api/

# Planning Protocol

Before proposing or implementing any non-trivial change, the agent must:

1. **Investigate and research online.** Use `web_search` and `web_fetch` to consult the official documentation and current best practices for every relevant technology in the change. Do not rely on memory or assumptions when an authoritative, up-to-date source is available.
2. **Formulate a clear plan.** Summarize findings, the intended approach, affected files, and any trade-offs or open questions.
3. **Prompt the user for explicit go-ahead.** Do not begin implementation until the user confirms the plan with an explicit response such as "go", "approved", "yes", or similar. Read-only exploration, file reading, and planning itself are allowed before confirmation; code edits and command execution that modify the project are not.

## Implementation Guidelines

- Always consult the relevant official documentation before implementing changes.
- Base implementations on documented APIs and recommended patterns.
- Do not rely on assumptions, outdated knowledge, or undocumented behavior when a documented source is available.
- When introducing new code, ensure it aligns with the framework's current best practices and conventions.
- If multiple technologies are involved, review the documentation for each relevant technology before proceeding.
- When documentation and existing code conflict, verify the intended behavior and follow the documented approach unless there is a project-specific requirement to do otherwise.
