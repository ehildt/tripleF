---
name: processors
description: Keep NestJS/BullMQ processors, controllers, and gateway entry points thin. Move domain logic, predicates, and side effects into the helpers and services that own them.
---

# Processors, Controllers & Gateway Entry Point Conventions

Use this skill when creating or editing NestJS/BullMQ processors, controllers, gateways, or any class whose job is to receive work and hand it off.

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

7. **Keep the entry point readable as an outline.**
   After refactoring, reading the processor/controller top-to-bottom should tell you the story of _what_ happens, not _how_ it is implemented.

## Decision Heuristics

When you find logic in a processor/controller that feels out of place, ask:

| Question                                                 | Where it usually belongs                       |
| -------------------------------------------------------- | ---------------------------------------------- |
| Does it interpret job/task shape?                        | Pure helper near the processor                 |
| Does it execute a task (model call, external API, etc.)? | Dedicated service                              |
| Does it handle failure, retry, cleanup, or persistence?  | Lifecycle / persistence / DLQ service          |
| Does it transform input/output data?                     | Pure helper or mapper in the consumer's folder |
| Does it need NestJS dependencies?                        | Service                                        |
| Is it stateless and only reads job/request data?         | Helper                                         |

## File Placement

| Type                             | Location                                                                 |
| -------------------------------- | ------------------------------------------------------------------------ |
| Processor/controller entry point | Inside the relevant feature module, e.g. `modules/<feature>/processors/` |
| Domain service                   | `modules/<feature>/services/`                                            |
| Pure predicate/helper            | `modules/<feature>/helpers/` or co-located `helpers/` folder             |
| Tests                            | Co-located `.spec.ts` for every file that exports logic                  |

## Checklist

- [ ] The processor/controller method body is short and reads like a dispatch table
- [ ] No private method in the entry point touches another domain
- [ ] Predicates used for routing are extracted to tested helpers
- [ ] Side effects (DLQ, retry, cleanup, external calls) live in services
- [ ] Lifecycle hooks only log, emit, and delegate
- [ ] Every extracted helper has a co-located `.helper.spec.ts`
- [ ] The entry point spec tests routing/delegation, not domain outcomes

## Example Mapping (abstract)

From a typical BullMQ job processor refactor:

- Job-shape predicates → tested helper functions near the processor
- Retry policy, max-attempt checks, and final failure persistence → a dedicated lifecycle/persistence service
- Processor routing logic → stays in the processor's `process()` method
- Lifecycle hooks → stay in the processor, but delegate to services
