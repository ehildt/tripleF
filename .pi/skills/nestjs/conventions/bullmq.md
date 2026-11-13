# NestJS BullMQ Convention

**Required when working with BullMQ in the server.** Read [controllers and entry points](controllers.md) for general dispatch and [server verification](../quality/server-verification.md) for coverage. Review [entry-point logic](../anti-patterns/entry-point-logic.md).

Official references: [NestJS queues](https://docs.nestjs.com/techniques/queues), [BullMQ](https://docs.bullmq.io/), and [KeyDB](https://docs.keydb.dev/) for the queue's backing service.

## Processor routing

A processor's `process()` method routes based on job type and calls the service owning that work. Routing logic remains in the processor; execution logic does not.

Job-shape predicates are small stateless helpers co-located near the processor. Model calls, external APIs, persistence, retry handling, dead-letter behavior, and cleanup belong to dedicated domain services.

A private processor method that touches one of those domains moves to that domain's service rather than remaining as an implementation detail of the processor.

## Decision and effect ownership

When a retry or failure branch depends on a predicate, keep the predicate evaluation, branch decision, and both side-effect paths together in the owning service method. Do not split the decision between processor and service so that neither owns the complete operation.

Pure job-shape inspection can remain a helper, but the service owns how its result changes retry, persistence, or cleanup behavior.

## Lifecycle hooks

Queue lifecycle hooks such as completed, active, and failed may write logs or metrics, emit events, and call the appropriate service.

They must not compute retry policy, remove jobs, transform payloads, persist final failure state, or call external systems directly. The hook observes and delegates; the service owns the domain response.

## Placement and coverage

Processors live in the relevant feature module's processors folder. Job-shape helpers live in a nearby helpers folder. Retry, persistence, lifecycle, and dead-letter services live in their domain-owning feature services folders.

Processor specs verify job-type routing and service delegation rather than service-domain outcomes. Helper specs directly exercise job-shape predicates. Service specs verify retry, cleanup, and persistence contracts. Creating or updating specs requires consent.

## Abstract mapping

For a typical job-processor refactor:

- Job-shape predicates move to approved tested helpers near the processor.
- Retry policy, maximum-attempt checks, and final failure persistence move to a dedicated lifecycle or persistence service.
- Job-type routing remains in the processor's main process method.
- Lifecycle hooks remain on the processor but only log, emit, and delegate.

## Completion checklist

- The processor routes and delegates without implementing domain execution.
- Every cross-domain private processor method has moved to its owner.
- Pure shape predicates and effect-owning services have distinct boundaries.
- Decisions and their side effects live together.
- Lifecycle hooks only log, emit, and delegate.
- Approved specs verify each unit's own contract.
