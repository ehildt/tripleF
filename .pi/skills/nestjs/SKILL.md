---
name: nestjs
description: NestJS and server-side architecture conventions for the monorepo. Use when creating or editing modules, controllers, gateways, services, helpers, DTOs, BullMQ processors, Prisma integration, or actions in apps/server/src. Covers entry-point thinning, module composition, naming, and consent-gated tests.
---

# NestJS Server Architecture Router

This skill governs server code under `apps/server/src`. Load every document applicable to the task; integration-specific conventions are loaded only when that integration is involved.

Official framework documentation: [NestJS](https://docs.nestjs.com).

## Route the task

| Task | Required conventions | Anti-pattern review |
| --- | --- | --- |
| Create or edit a controller, gateway, resolver, or other work-receiving entry point | [Controllers and entry points](conventions/controllers.md) | [Entry-point logic](anti-patterns/entry-point-logic.md) |
| Create or change a feature module, root composition, provider ownership, or registration | [Feature modules](conventions/feature-modules.md) | [Module coupling](anti-patterns/module-coupling.md) |
| Add domain behavior, outbound endpoint lanes, a shared service base, or failure semantics | [Services](conventions/services.md) | [Service indirection](anti-patterns/service-indirection.md) |
| Extract a pure predicate or decide whether simple logic should stay inline | [Helper extraction](conventions/helper-extraction.md) | [Service indirection](anti-patterns/service-indirection.md) |
| Create or edit a BullMQ processor, job lifecycle hook, retry, cleanup, or DLQ flow | [BullMQ](conventions/bullmq.md), [Controllers and entry points](conventions/controllers.md) | [Entry-point logic](anti-patterns/entry-point-logic.md), [Service indirection](anti-patterns/service-indirection.md) |
| Change Prisma schema ownership, generation, migration, push, or build integration | [Prisma](conventions/prisma.md) | No additional anti-pattern document unless entry-point code is also touched |
| Create, update, run, or review server tests and runtime verification | [Server verification](quality/server-verification.md) | Add the anti-pattern document for each implementation unit touched |

Generic structure rules apply independently of framework choice: intentional names, one function per file, explicit co-located types, role suffixes, actual-consumer co-location, no barrels, and no wrappers.

## Always apply

- Entry points receive, validate, route, and delegate; they do not decide domain rules.
- A private method that touches another domain moves to that domain's owner.
- Move a branch's decision, predicate, and side effect into the same owning service method unless a clear boundary says otherwise.
- Lifecycle hooks only log, emit, and delegate.
- A service method owns one concept and one domain object.
- Helpers are pure, stateless, decorator-free, and dependency-free. Every helper requires a co-located helper spec, whose creation or update remains consent-gated.
- Prefer readable inline guards and simple branches over premature extraction.
- Feature modules are optionless, memoized dynamic registrations and are never global. Global scope is reserved for documented connection-class infrastructure and the root environment registry.
- The root module is only a composition root.
- Module-graph changes require a clean application boot and representative route responses; static gates cannot verify DI wiring.
- Read every call site before changing a guard or catch contract. Consumers provide stronger evidence than stale docblocks.
- Existing tests are a regression net and contract, not infallible proof. Report a breaking change before modifying either side.

## Completion checklist

- Each touched unit has one domain owner and an intentional location.
- Entry points, services, modules, helpers, and integrations follow their routed conventions.
- No global feature, god module, wrapper façade, or misplaced side effect was introduced.
- Approved coverage is co-located; runtime graph verification is complete when required.
