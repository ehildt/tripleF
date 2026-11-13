# Controller and Entry-Point Convention

**Required.** Use this document for controllers, gateways, resolvers, and classes whose primary job is to receive work and hand it off. BullMQ processors additionally require [BullMQ](bullmq.md). Review [entry-point logic](../anti-patterns/entry-point-logic.md).

Official background: [NestJS controllers](https://docs.nestjs.com/controllers) and [gateways](https://docs.nestjs.com/websockets/gateways).

## Responsibility

An entry point validates or interprets its transport input, selects the appropriate owner, and delegates. Its main method should be short and read like a dispatch table. It does not compute retry policy, transform domain payloads, remove jobs, persist failure state, call external systems, or implement business rules directly.

A private method in an entry point that deals with retries, dead-letter handling, persistence, model calls, external APIs, or another domain belongs to the service owning that domain.

Lifecycle or event hooks only log, emit metrics or events, and delegate to the appropriate service. They do not make domain decisions or invoke external systems directly.

## Decision heuristics

| Question | Usual owner |
| --- | --- |
| Does it interpret request or task shape without external state? | Pure helper near the entry point |
| Does it execute a model call or external API operation? | Dedicated domain service |
| Does it handle failure, retry, cleanup, or persistence? | Lifecycle, persistence, or DLQ service |
| Does it transform input or output data? | Pure helper or mapper in the consumer's folder |
| Does it need NestJS-injected dependencies? | Service |
| Is it stateless and limited to supplied request or job data? | Helper |

Move the predicate, branch decision, and resulting side effect together into the same service method when they form one domain operation. Splitting them between caller and callee leaves both units with incomplete ownership.

## File placement

- Entry points live inside the relevant feature module, such as `modules/<feature>/controllers/`, `modules/<feature>/gateways/`, or `modules/<feature>/processors/`.
- Domain services live in `modules/<feature>/services/`.
- Pure predicates and mappers live in `modules/<feature>/helpers/` or an equivalent co-located helpers folder.
- Approved specs are co-located with the unit whose routing or logic they cover.

## Coverage boundary

An entry-point spec verifies routing, validation, and delegation rather than domain outcomes owned by services. Service specs cover domain behavior; helper specs cover pure input/output decisions.

Every extracted helper requires a co-located helper spec, but creating or updating it requires consent. See [server verification](../quality/server-verification.md).

## Prose examples

- A controller validates an incoming payload and calls the feature service. It does not catch a domain failure and decide retry policy itself.
- A gateway translates a socket event into a service call and emits the service's documented result; payload normalization is a pure mapper when substantive.
- A request-shape predicate stays in a tested helper near the controller, while the branch that performs persistence stays with the predicate's result in the owning service.

## Completion checklist

- The entry method reads as validation and dispatch rather than domain implementation.
- No private entry-point method touches another domain.
- Pure shape predicates are helper-owned; effects and workflows are service-owned.
- Lifecycle hooks only log, emit, and delegate.
- Approved specs test the entry point's own routing contract.
