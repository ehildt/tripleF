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

# NestJS Module Conventions

These rules apply to `server/src` module code (processors, controllers, services, helpers, actions). The [processors skill](.pi/skills/processors/SKILL.md) covers entry-point thinning; this section codifies naming, helper conventions, and coding patterns applicable across the entire server.

## Naming

Every variable, function, service, and file name must answer "what does this do?" on its own. No abbreviations, no vague containers (`util`, `manager`, `handler`).

| Category                 | Pattern                    | Example                                                   |
| ------------------------ | -------------------------- | --------------------------------------------------------- |
| Action method / function | verb + noun                | `buildIntentSelectionPrompt()`, `normalizeJsonResponse()` |
| Predicate helper         | `is`/`has`/`should` prefix | `isTrustedImageUrl()`, `hasCompletedExchanges()`          |
| Formatting helper        | `format` + what            | `formatContextUsagePercent()`                             |
| Calculation helper       | `calc` + what              | `calcTokenPercent()`                                      |
| Helper file              | function-name `.helper.ts` | `strip-html.helper.ts` → exports `stripHtml()`            |
| Service file             | domain-noun `.service.ts`  | `harness-context.service.ts`                              |

## Helpers — one function per file, co-located, with spec

- Each helper lives in its own `.helper.ts` file inside a `helpers/` folder.
- Helpers are **pure and stateless** — no NestJS decorators, no injected deps. (Those belong in services.)
- Every `.helper.ts` gets a co-located `.helper.spec.ts` test file.
- No barrel files (`index.ts`). Import directly from the defining file.

## Prefer inline patterns

When logic is simple and self-documenting, keep it inline rather than extracting:

- **Arrow callbacks in iterators:** `[].filter(x => x.active)` instead of `filterByIdentity(isActive)`
- **Guard clauses / early returns:** `if (!x) return;` at the top instead of wrapping the entire body in `if (x) { ... }`
- **Short ternaries for simple branches:** `a ? 'yes' : 'no'` instead of a 5-line if-else that only assigns one variable
- **Single-assignment blocks** that follow immediately don't need extraction into named functions
- **Single-statement return/throw:** `if (!x) return value;` instead of `if (!x) { return value; }`
- **Guard + throw in one line:** `if (!result) throw new Error(...)` instead of wrapping the error in braces
- **Lookup objects over if-chains:** Use a `Record<string, handler>` dispatch map instead of sequential `if (type === 'a') ... else if ...` when >3 branches map type to action
- **Flat if-filters in iterators:** Prefer `.filter(x => !x.dirty && x.length)` over `.filter(isClean).filter(hasLength)` chained calls
- **No unnecessary intermediate variables for boolean branching:** Assign the result directly instead of storing a bool that feeds a single `if`

## No wrapper functions

A function earns its name only if the call site can't already see what it does. Pure rename-wrappers like `function foo(x) { return bar(x.id) }` add indirection without information. Either inline the call or promote to a real `.helper.ts` with tests.

## Tests and stories are deferred

Do **not** create `.spec.ts`, `.test.ts`, or `.stories.ts` files during implementation. After implementing code, ask the user to test it manually. Once the user confirms the behavior is correct, offer to generate the corresponding test/story files as a separate step.
