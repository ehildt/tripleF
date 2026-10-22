---
name: nestjs
description: NestJS, BullMQ, and server-side architecture conventions for the ckir.io/visions monorepo. Use when creating or editing NestJS modules, controllers, processors, gateways, services, helpers, DTOs, or actions in server/src. Covers entry-point thinning, naming, helper rules, inline patterns, and consent-gated tests.
---

# NestJS Server-Side Conventions

This skill governs all code under `server/src`: modules, controllers, services, helpers, processors, gateways, DTOs, and actions.

Official NestJS documentation: https://docs.nestjs.com

Generic structure rules — names express intent, one function per file, co-located explicit types, role suffixes, co-location, no barrels, no wrapper functions — are canonically defined in the [code-structure](../code-structure/SKILL.md) skill; where wording overlaps with this skill, code-structure is canonical.

## Quick Rules

1. **Entry points route; they do not decide domain rules.**
   A processor's `process()` should call a service based on the job type. A controller should validate input and delegate. Avoid embedding business logic in lifecycle hooks.

2. **A private method that touches another domain belongs elsewhere.**
   If a method in a processor/controller deals with retries, dead-letter handling, persistence, model calls, or external APIs, move it to the service that owns that domain.

3. **Use pure helpers for cross-cutting predicates.**
   Predicates that inspect job/request shape should be small, stateless, and tested functions co-located near the consumer that needs them.

4. **Move the decision, predicate, and side effect together.**
   When a branch depends on a predicate, the predicate and both branches should usually live in the same service method rather than being split between caller and callee.

5. **Lifecycle hooks only log, emit, and delegate.**
   `completed`, `active`, `failed`, etc., may write logs/metrics and call the appropriate service. They should not compute retry policy, remove jobs, transform payloads, or call external systems directly.

6. **One concept per service method.**
   A service method should do one thing with one domain object. If a method both compacts a conversation and updates a leaderboard, split it.

7. **Names express intent.**
   Every variable, function, service, and file name must answer "what does this do?" on its own. No abbreviations, no vague containers (`util`, `manager`, `handler`).

8. **Helpers are pure and stateless.**
   Each helper lives in its own `.helper.ts` file inside a `helpers/` folder. No NestJS decorators, no injected dependencies. Every `.helper.ts` gets a co-located `.helper.spec.ts`.

9. **Prefer inline patterns when logic is simple.**
   Guard clauses, short ternaries, single-statement return/throw, arrow callbacks in iterators, and lookup objects over long `if` chains keep code readable without premature extraction.

10. **No wrapper functions.**
    A function earns its name only if the call site can't already see what it does. Pure rename-wrappers add indirection without information.

11. **Tests and stories are consent-gated.**
    Do not create `.spec.ts`, `.test.ts`, or `.stories.ts` files during implementation — creating them requires explicit user consent (`.pi/APPEND_SYSTEM.md` § Tests, Stories & Browser Automation). After implementing code, ask the user to test it manually; once behavior is confirmed, offer tests as a separate step.

12. **Feature modules are dynamic, optionless, and never `@Global()`.**
    `register()` returns one memoized registration object per module class — the app runs Nest's default by-reference module ids, so a fresh object per call site would instantiate the module (and its controllers) several times. See Feature Modules & Composition.

## Entry-Point Conventions

Use this section when creating or editing NestJS/BullMQ processors, controllers, gateways, or any class whose job is to receive work and hand it off.

### Decision Heuristics

When you find logic in a processor/controller that feels out of place, ask:

| Question                                                 | Where it usually belongs                       |
| -------------------------------------------------------- | ---------------------------------------------- |
| Does it interpret job/task shape?                        | Pure helper near the processor                 |
| Does it execute a task (model call, external API, etc.)? | Dedicated service                              |
| Does it handle failure, retry, cleanup, or persistence?  | Lifecycle / persistence / DLQ service          |
| Does it transform input/output data?                     | Pure helper or mapper in the consumer's folder |
| Does it need NestJS dependencies?                        | Service                                        |
| Is it stateless and only reads job/request data?         | Helper                                         |

### File Placement

| Type                             | Location                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Processor/controller entry point | Inside the relevant feature module, e.g. `modules/<feature>/processors/` |
| Domain service                   | `modules/<feature>/services/`                                            |
| Pure predicate/helper            | `modules/<feature>/helpers/` or co-located `helpers/` folder             |
| Tests                            | Co-located `.spec.ts` for every file that exports logic                  |

### Entry-Point Checklist

- [ ] The processor/controller method body is short and reads like a dispatch table
- [ ] No private method in the entry point touches another domain
- [ ] Predicates used for routing are extracted to tested helpers
- [ ] Side effects (DLQ, retry, cleanup, external calls) live in services
- [ ] Lifecycle hooks only log, emit, and delegate
- [ ] Every extracted helper has a co-located `.helper.spec.ts`
- [ ] The entry point spec tests routing/delegation, not domain outcomes

## Feature Modules & Composition

This section governs how `modules/<feature>` folders package themselves and how the root module composes them.

### Feature modules are dynamic and optionless

A feature module is a bare `@Module({})` class with a static `register()` that returns the module metadata as a `DynamicModule`. The class holds one private static readonly registration object — built once, eagerly — and `register()` returns that same object every time. This is not ceremony: the app runs Nest's default by-reference module ids, where the framework stamps a random id on each distinct returned object, so returning fresh metadata per call site silently instantiates the module once per importing module — duplicated controllers surface at boot as duplicated routes. The shared object restores the singleton semantics a static module class used to give for free. If a module ever takes options, that memoization is exactly what must go: distinct options legitimately mean distinct registrations.

Third-party dynamic modules keep their own semantics — modules whose registration is intentionally per importing module (per-module scoping of `HealthIndicatorService` is the standing example) rely on the same by-reference behavior. Never switch the app to deep-hash module ids to "fix" duplication; it would collapse those intentional per-site registrations.

### No `@Global()` on feature modules

Globals are reserved for connection-class package infrastructure — queue connections, the socket server, loggers, model-client modules — where the injection token must resolve everywhere like a database pool, and for the root env-config registry. Every feature dependency is an explicit `imports` edge. When the graph cycles, move provider ownership to the module whose domain owns the provider; do not re-globalize to escape the cycle. Providers live in the module of the folder they live in — a service file in another folder provided by the wrong module is a relocation waiting to happen.

### Package factories resolve from their own scope

A package module's `registerAsync` factory resolves its `inject` tokens from the package module's own `imports` option plus global providers — never from the importing host module's providers or imports. A factory that needs a non-global app service therefore requires the package to accept an `imports` passthrough of module metadata, and when a package lacks one, the fix is an additive extension to the package (following the publishing workflow), never a wrapper or a second registration path in the app.

### The root module is a composition root

The root module holds only feature-module `register()` calls, the global env-config registry, and cross-cutting client registrations that have no feature folder of their own. Controllers, services, repositories, and health indicators belong to feature modules. A root module listing feature classes is the god-module smell growing back.

### Config services register twice, on purpose

A config service appears both in the root env-config registry's providers (global, drives schema-backed factory registration) and in its owning feature module's providers (ownership and local resolution). This dual registration is the house pattern, not a leftover.

### Module-graph changes are not done until the app boots

Module DI miswiring is invisible to type-check, lint, and unit tests — all of them pass on a broken graph. After any module-structure change, the compose stack's server must boot clean and representative routes must respond before the change counts as verified.

### Outbound clients split by endpoint family

A service that wraps another app's REST surface is split into one service per endpoint family (lane), named explicitly after the lane — a one-method service is fine when the family is the unit. Shared HTTP plumbing (base URL, feature flag, fail-fast fetch) lives in a module-internal transport service that is not exported. The lanes are the public surface; a façade service that re-publishes them is the no-wrapper rule at class level and is deleted, not kept.

### Sibling lanes with an identical skeleton share a template-method base

When sibling services carry the same lifecycle mechanics — the standing example is capability-discovery lanes whose cache TTL, per-key freshness guard, single-flight, and never-throws refresh semantics are line-for-line identical — lift the mechanics into one abstract base the lanes extend. The base owns all bookkeeping on success and failure so subclasses cannot fork the semantics; each subclass keeps only the part that genuinely differs (fetching and building its snapshot). The base is DI-free and never registered as a provider: subclasses carry their own `@Injectable()` and constructor tokens, and the base builds its logger from the constructor name so each lane keeps its own log context. Name the base after the shared behavior, not after the folder it sits in. The boundary: hierarchy runs *within* one lane family, never across a folder — a base meant to unite services with unrelated jobs (persistence, secrets, merging on one side, probing on the other) is coupling dressed as reuse and is refused on sight.

### Failure semantics come from consumers, not docblocks

Before changing a service method's guard or catch behavior, read every call site. The observed contract — what callers defensively wrap, what they expect to throw — is the contract; class docblocks drift from it. Align the docblock to the evidence, not the other way around.

## Naming

Every variable, function, service, and file name must answer "what does this do?" on its own.

| Category                 | Pattern                    | Example                                                   |
| ------------------------ | -------------------------- | --------------------------------------------------------- |
| Action method / function | verb + noun                | `buildIntentSelectionPrompt()`, `normalizeJsonResponse()` |
| Predicate helper         | `is`/`has`/`should` prefix | `isTrustedImageUrl()`, `hasCompletedExchanges()`          |
| Formatting helper        | `format` + what            | `formatContextUsagePercent()`                             |
| Calculation helper       | `calc` + what              | `calcTokenPercent()`                                      |
| Helper file              | function-name `.helper.ts` | `strip-html.helper.ts` → exports `stripHtml()`            |
| Service file             | domain-noun `.service.ts`  | `harness-context.service.ts`                              |

## Helpers

- Each helper lives in its own `.helper.ts` file inside a `helpers/` folder.
- Helpers are **pure and stateless** — no NestJS decorators, no injected deps. (Those belong in services.)
- Every `.helper.ts` pairs with a co-located `.helper.spec.ts` test file (created only with user consent — see Tests and Stories).
- No barrel files (`index.ts`). Import directly from the defining file.

## Prefer Inline Patterns

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

## No Wrapper Functions

A function earns its name only if the call site can't already see what it does. Pure rename-wrappers like `function foo(x) { return bar(x.id) }` add indirection without information. Either inline the call or promote to a real `.helper.ts` with tests.

## Tests and Stories

Tests and stories are consent-gated: creating them requires explicit user consent (`.pi/APPEND_SYSTEM.md` § Tests, Stories & Browser Automation). Do not create them during implementation; ask the user to test manually first, then offer tests/stories as a separate step.

Existing tests are a regression net — run them after changes. A test is a contract, not infallible: it documents how the code worked when written and may drift from the code, so neither a failing nor a passing test is blindly trusted. When a change would break an existing test, report it to the user before modifying either the code or the test.

When specs do exist, the convention is a co-located `.helper.spec.ts` for every helper and a `.spec.ts` beside each file that exports logic.

## Example Mapping (abstract)

From a typical BullMQ job processor refactor:

- Job-shape predicates → tested helper functions near the processor
- Retry policy, max-attempt checks, and final failure persistence → a dedicated lifecycle/persistence service
- Processor routing logic → stays in the processor's `process()` method
- Lifecycle hooks → stay in the processor, but delegate to services
