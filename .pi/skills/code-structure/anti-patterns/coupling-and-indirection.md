# Coupling and Indirection Anti-Patterns

Use this document before adding wrappers, aggregation modules, returned-object aliases, component relays, or behavior derived from styling hooks.

## No barrel files

A barrel is a re-export-only `index.ts` that aggregates sibling imports. Do not create one. Import directly from the defining file so the import path itself communicates ownership.

Direct paths make searches and refactors understandable, keep moves local to real importers, and avoid exposing internal helpers and types across boundaries. Barrels provide no tree-shaking benefit and tend to grow into opaque public surfaces.

The rule targets aggregation behavior, not a particular filename. A function or composable that gathers and re-deals other units' APIs is a barrel in function form; consumers import the defining units directly.

The sole exception is a published package's declared public entry points. When a package export map exposes a compiled entry, that file may re-export the package's intentional public surface. Interior package code still imports defining files directly, and the exception does not extend to application folders.

## No wrapper functions

A function earns its name only when the call site cannot already see what it does. A wrapper that renames a field or delegates to one call adds indirection without information.

Inline the operation when the existing name is sufficient. Name the resulting binding rather than a one-line function when a reused value needs domain intent. Promote a cross-file domain concept to a real helper with approved coverage. Functions that branch, supply defaults, narrow types, or own side effects perform real work and remain.

Dependency injection that decouples a consumer from a store or service earns its name by removing coupling. An abstract base class that owns lifecycle bookkeeping, guard logic, or failure semantics also owns behavior and is not a wrapper; the ban targets rename-and-delegate indirection, not behavior-owning ancestors.

The same rule applies to returned objects. Never republish another unit's members unchanged, whether verbatim, renamed, or flattened. A returned member must be owned, derived, or composed into new behavior. Consumers import the defining unit directly.

One sanctioned delegation shape exists: when a producer privately creates a per-caller service instance whose wiring it must retain, expose that instance under one namespaced key rather than flattening its members into re-exports.

At component level, redeclaring another component's props under renamed keys or forwarding its events unchanged is the same wrapper anti-pattern. A wrapper component must add its own chrome or behavior.

## Complete consolidation by design merit

Judge options by the design they serve, not by the number of files touched. The zero-edit option carries the same burden of proof as a change.

Read old implementation comments before treating a workaround artifact as intended design. Finish approved simplifications rather than leaving a constant that restates a shared value, a validation guard no call path can reach, or another dead remnant. If a deliberate leftover remains, explain its design reason.

## Repeated keyed reads are a legitimate owner API

When the same keyed lookup, fallback, optional access, or presence check over owned reactive records is needed more than once, define a named getter function on the owning store or composable with an explicit return type. Use it for internal mutations and consumers instead of repeating raw indexed access.

When the same result is repeatedly compared with an expected value or tested for membership, extend the getter with an optional expected-value argument and explicit TypeScript overloads. The base call returns the value; the comparison call returns a boolean using exact equality or membership semantics. Detect omission by argument presence, never truthiness, so empty strings and other falsy expectations remain valid. Do not expose an untyped union-returning API or add a consumer-side comparator relay.

A lookup used once stays inline. Do not add a second function that only delegates to the owner's getter. Raw state can remain visible where Pinia requires it or for intentional key-existence assertions, but ordinary repeated reads use the getter.

This owner API centralizes key shape and missing-value semantics and is not banned wrapper indirection.

## CSS classes are not an API

Never derive behavior from another unit's DOM: counting children by class, sniffing structure, or branching on selector results turns cosmetic names into hidden cross-component contracts that fail silently after a rename.

Styling hooks belong to the component that renders them. If a consumer needs to know what was rendered, flow that information through props, events, or an explicitly passed count rather than DOM inspection.

## Review checklist

- No new barrel, proxy return, compatibility forwarder, or rename-only function exists.
- Every retained abstraction owns meaningful behavior or removes coupling.
- Repeated keyed operations have one typed owner API; single-use operations remain inline.
- No behavior depends on styling classes or another component's DOM structure.
- Consolidation decisions and leftovers are justified by design merit rather than diff size.
