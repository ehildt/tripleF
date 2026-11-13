# Module Coupling Anti-Patterns

Read this document before changing module scope, registration, provider ownership, or root composition. Positive rules live in [feature modules](../conventions/feature-modules.md).

## Global feature modules

**Banned:** marking a feature module with `@Global()` to avoid explicit imports or escape a graph cycle.

**Why:** global scope hides feature dependencies and couples unrelated areas. Cycles usually indicate incorrect provider ownership.

**Required alternative:** use explicit imports and move the provider to its domain-owning module. Reserve global scope for documented connection-class infrastructure and the root environment registry.

## Fresh optionless registration objects

**Banned:** returning a newly created metadata object from every optionless feature registration call in the application's by-reference module-identity mode.

**Why:** Nest treats each object as a distinct registration, which can instantiate the module and controllers repeatedly and expose duplicated routes.

**Required alternative:** memoize one static readonly registration object per optionless feature module. Remove memoization only when real options make registrations meaningfully distinct.

## Deep-hash identity as a duplication fix

**Banned:** switching the application to deep-hash module identities to suppress duplicate optionless registrations.

**Why:** that collapses intentional per-importing-module registrations in third-party packages and changes their provider scoping semantics.

**Required alternative:** preserve default by-reference behavior, memoize optionless feature metadata, and retain intentional third-party per-site registration.

## God-module roots

**Banned:** listing feature controllers, services, repositories, or health indicators directly in the root module.

**Why:** the root stops being a composition root and reaccumulates feature ownership.

**Required alternative:** root composition contains feature registrations, the global environment registry, and only cross-cutting clients with no feature home.

## Wrong-module providers

**Banned:** providing a service from a module unrelated to the folder and domain in which that service lives.

**Why:** module metadata then contradicts code ownership and creates misleading import edges.

**Required alternative:** relocate the provider or its ownership so folder, domain, and module agree.

## Host-scope package-factory assumptions

**Banned:** expecting a package's asynchronous registration factory to inject a non-global provider from the importing host module.

**Why:** the factory resolves from the package module's own imports and global providers, not the host's full graph.

**Required alternative:** use or additively extend the package's imports passthrough through its publishing workflow. Never add a wrapper or second application registration path to bypass the boundary.

## Exception to preserve

Config-service dual registration in the root environment registry and owning feature is intentional. Do not delete it as duplicate coupling; each registration serves a distinct resolution role.

## Review checklist

- No feature global, god root, wrong-module provider, or host-scope factory assumption was introduced.
- Optionless registration identity is memoized without changing third-party semantics.
- Deep-hash identity is not used as a workaround.
- Config dual registration remains intact.
- Runtime boot and representative routes verify the graph.
