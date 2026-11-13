# Service Convention

**Required.** Use this document when adding domain behavior, changing failure semantics, splitting outbound clients, or sharing service mechanics. Review [service indirection](../anti-patterns/service-indirection.md).

Official background: [NestJS providers](https://docs.nestjs.com/providers).

## One concept per method

A service method does one thing with one domain object. If one method both compacts a conversation and updates a leaderboard, split those domain operations rather than hiding two responsibilities behind a generic method name.

Move a decision, its predicate, and its side effect together. When a branch depends on a predicate, the predicate and both resulting branches usually live in the same service method rather than being divided between caller and callee.

Services own behavior requiring injected dependencies, external calls, persistence, lifecycle coordination, or domain state. Pure stateless transformations belong to helpers; simple self-documenting operations can stay inline.

Service files use a domain noun plus the `.service.ts` suffix, such as `harness-context.service.ts`. Action methods use verb-plus-noun names that reveal their actual result.

## Outbound clients split by endpoint family

A service wrapping another application's REST surface is split into one service per endpoint family or lane, named explicitly after that lane. A one-method service is acceptable when the endpoint family is the unit of ownership.

Shared HTTP plumbing such as base URL, feature flag, and fail-fast fetch behavior lives in a module-internal transport service that is not exported. The lane services are the public surface.

A façade service that only republishes those lanes is class-level wrapper indirection and is deleted rather than retained.

## Template-method base for identical sibling lanes

When sibling services share line-for-line lifecycle mechanics, lift those mechanics into one abstract base that the lanes extend. The standing example is capability-discovery lanes sharing cache TTL, per-key freshness guards, single-flight behavior, and never-throws refresh semantics.

The base owns all success and failure bookkeeping so subclasses cannot fork those semantics. Each subclass retains only the behavior that genuinely differs, such as fetching and building its snapshot.

The base is DI-free and is never registered as a provider. Subclasses carry their own `@Injectable()` decorator and constructor tokens. The base builds its logger from the constructor name so each lane retains its own log context. Name the base after the shared behavior rather than its folder.

The hierarchy stays within one lane family. Never unite unrelated services such as persistence, secrets, merging, and probing through a base merely because their file layout resembles reuse; that is coupling rather than a valid abstraction.

## Failure semantics come from consumers

Before changing a service method's guard or catch behavior, read every call site. What callers defensively wrap and what they expect to throw is the observed contract. Class docblocks can drift from that behavior.

Align documentation to call-site evidence rather than changing consumers to match an outdated docblock. Report any intentional contract change before modifying dependent behavior or existing tests.

## Prose examples

- Two REST lanes share transport plumbing but remain separate public services; no façade renames their methods.
- Capability-discovery subclasses implement only snapshot acquisition while their base owns all freshness and refresh bookkeeping.
- A persistence service and a probing service do not share a base solely because both perform asynchronous work.
- A service that currently throws on missing data retains that behavior when callers rely on it, even if its docblock incorrectly suggests a fallback.

## Completion checklist

- Every service method has one domain responsibility and coherent decision/effect ownership.
- Endpoint lanes expose their own surface and share only internal transport plumbing.
- A template-method base is limited to one family with truly identical mechanics.
- The base remains DI-free and subclasses retain their injection and log identity.
- Guard and catch changes are grounded in every observed consumer contract.
