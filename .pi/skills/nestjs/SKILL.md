---
name: nestjs
description: NestJS, BullMQ, and server-side architecture conventions for the ckir.io/visions monorepo. Use when creating or editing NestJS modules, controllers, processors, gateways, services, helpers, DTOs, or actions in server/src. Covers entry-point thinning, naming, helper rules, inline patterns, and deferred tests.
---

# NestJS Server-Side Conventions

This skill governs all code under `server/src`: modules, controllers, services, helpers, processors, gateways, DTOs, and actions.

Official NestJS documentation: https://docs.nestjs.com

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

11. **Tests and stories are deferred.**
    Do not create `.spec.ts`, `.test.ts`, or `.stories.ts` during implementation. After implementing code, ask the user to test it manually. Once behavior is confirmed, offer tests as a separate step.

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
- Every `.helper.ts` gets a co-located `.helper.spec.ts` test file.
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

Do **not** create `.spec.ts`, `.test.ts`, or `.stories.ts` files during implementation. After implementing code, ask the user to test it manually. Once the user confirms the behavior is correct, offer to generate the corresponding test/story files as a separate step.

## Example Mapping (abstract)

From a typical BullMQ job processor refactor:

- Job-shape predicates → tested helper functions near the processor
- Retry policy, max-attempt checks, and final failure persistence → a dedicated lifecycle/persistence service
- Processor routing logic → stays in the processor's `process()` method
- Lifecycle hooks → stay in the processor, but delegate to services
