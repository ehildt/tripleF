# Entry-Point Logic Anti-Patterns

Read this document whenever changing controllers, gateways, processors, or lifecycle hooks. Positive ownership is defined in [controllers and entry points](../conventions/controllers.md) and [BullMQ](../conventions/bullmq.md).

## Domain logic does not belong to integration entry points

**Banned:** embedding retry policy, persistence decisions, dead-letter handling, model calls, external API execution, payload transformation, or other business rules inside an entry-point method.

**Why:** the transport boundary becomes the domain owner, making behavior harder to reuse, verify, and reason about independently of the request or job.

**Required alternative:** validate and route at the entry point, then delegate to the domain-owning service. Pure request or job-shape predicates may live in a nearby tested helper.

## Cross-domain private methods are misplaced

**Banned:** keeping a private method in a processor or controller when its behavior concerns retries, persistence, cleanup, external systems, or another domain.

**Why:** private visibility hides the ownership violation rather than resolving it. The entry point still owns another domain's behavior.

**Required alternative:** move the method to the service that owns that domain and update the entry point to delegate. Do not leave a forwarding private wrapper behind.

## Decisions and effects must not be split

**Banned:** evaluating a predicate in one unit while its caller or callee owns the branch and side effects without sharing the full decision context.

**Why:** neither unit owns the complete domain operation, and changes to the predicate can silently invalidate the branch semantics.

**Required alternative:** move the decision, predicate, and both side-effect paths into the same service method unless a documented pure helper supplies only shape inspection.

## Lifecycle hooks do not execute domain workflows

**Banned:** computing retry policy, removing jobs, transforming payloads, persisting final failures, or calling external systems directly from active, completed, failed, or similar lifecycle hooks.

**Why:** observer hooks become hidden workflow implementations with unclear ordering and failure behavior.

**Required alternative:** lifecycle hooks only log, emit metrics or events, and delegate to the appropriate service.

## Prose scenarios

- A failed-job hook logs the event and calls the failure service; it does not itself decide whether attempts are exhausted.
- A controller validates input and delegates archival; it does not directly update persistence based on a private retry predicate.
- A processor keeps job-type routing but moves model execution and final failure persistence to their services.

## Review checklist

- Entry methods contain only input handling, routing, and delegation.
- No private entry-point method owns another domain.
- Predicates and their effect-owning branches share one owner.
- Lifecycle hooks remain observers that log, emit, and delegate.
