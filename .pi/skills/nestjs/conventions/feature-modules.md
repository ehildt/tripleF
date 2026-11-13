# Feature Module and Composition Convention

**Required.** Use this document when changing feature modules, the root module, provider ownership, dynamic registration, or package-module factories. Review [module coupling](../anti-patterns/module-coupling.md).

Official background: [NestJS modules](https://docs.nestjs.com/modules) and [dynamic modules](https://docs.nestjs.com/fundamentals/dynamic-modules). The project's optionless memoized registration rule is intentionally more specific than the generic API.

## Optionless feature registration

A feature module is a bare `@Module({})` class with a static `register()` that returns `DynamicModule` metadata. The class holds one private static readonly registration object built once, eagerly, and `register()` returns that same object every time.

The application uses Nest's default by-reference module identity. A fresh metadata object at each call site receives a distinct identity and can instantiate the module and its controllers once per importing module, surfacing as duplicated routes at boot. Returning the shared object preserves singleton semantics for an optionless feature.

If a module ever accepts options, memoization must be removed for that configurable registration because distinct options legitimately represent distinct configurations. Do not generalize the optionless memoization rule to configurable modules.

Third-party dynamic modules retain their own semantics. A package intentionally registered per importing module relies on the same by-reference behavior; per-module scoping of `HealthIndicatorService` is the standing example. Never switch the application to deep-hash module identities to hide duplication because doing so would collapse those intentional per-site registrations.

## Explicit imports instead of feature globals

Do not mark feature modules with `@Global()`. Global scope is reserved for connection-class package infrastructure such as queue connections, socket servers, loggers, and model-client modules whose token must resolve everywhere like a database pool, plus the root environment-configuration registry.

Every feature dependency is an explicit module import edge. When the graph cycles, move provider ownership to the module whose domain owns the provider rather than making a feature global to escape the cycle.

A provider belongs to the module owning the folder in which its file lives. A service file in one folder provided by an unrelated module indicates misplaced ownership and should be relocated.

## Package-factory resolution scope

A package module's `registerAsync` factory resolves its injected tokens from that package module's own imports plus global providers, never from the importing host's providers or imports.

If a factory needs a non-global application service, the package must accept an imports passthrough of module metadata. When the package lacks that capability, extend the package additively through its publishing workflow. Do not create an application wrapper or second registration path to bypass the package boundary.

## Root composition

The root module contains only feature-module registration calls, the global environment registry, and cross-cutting client registrations with no feature folder of their own.

Controllers, services, repositories, and health indicators belong to feature modules. A root module listing feature implementation classes is a god-module smell.

## Config services register twice

A config service intentionally appears in both the root environment registry's providers, where it drives schema-backed factory registration globally, and its owning feature module's providers, where ownership and local resolution remain explicit. This dual registration is the house pattern, not an accidental duplicate.

## Runtime verification

Module DI miswiring can pass type-check, lint, and unit tests while failing at startup or duplicating routes. After any module-structure change, boot the Compose server cleanly and exercise representative routes before calling the change verified. See [server verification](../quality/server-verification.md).

## Prose examples

- Two feature modules needing one domain provider import the feature that exports it. Neither feature becomes global.
- An optionless feature returns its one memoized registration object at every import. A package whose options differ per importer returns distinct registrations instead.
- A package factory requiring a feature service gains an explicit package imports passthrough; it does not secretly resolve the host's provider.
- A root module composes feature registrations but does not list their controllers and repositories directly.

## Completion checklist

- Optionless feature registration returns one memoized object; configurable and third-party semantics remain distinct.
- No feature is global and every feature dependency is explicit.
- Providers live in their domain-owning modules.
- Package factories resolve only from their own imports and global providers.
- The root module remains a composition root and config dual registration is preserved.
- The application boots cleanly and representative routes respond after graph changes.
