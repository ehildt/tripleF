# Service Indirection Anti-Patterns

Read this document before adding service methods, façades, wrapper functions, or inheritance. Positive rules live in [services](../conventions/services.md) and [helper extraction](../conventions/helper-extraction.md).

## Rename-only functions

**Banned:** a function that merely selects a field, renames a call, or delegates directly to another function without adding information.

**Why:** the call site already communicates the operation, while the wrapper adds a jump and another API surface.

**Required alternative:** inline the operation or promote a substantive cross-file domain predicate or transformation into a pure helper with approved coverage. Branching, defaulting, type narrowing, and dependency decoupling can earn a real name.

## Multi-domain service methods

**Banned:** one method that performs unrelated domain operations, such as compacting a conversation and updating a leaderboard.

**Why:** callers cannot request one result without triggering the other, and ownership becomes ambiguous.

**Required alternative:** split methods by domain concept and object. Keep each decision, predicate, and resulting effect together in the method that owns the operation.

## Lane façades

**Banned:** a service that republishes endpoint-lane services without adding behavior.

**Why:** it is the no-wrapper rule at class level, duplicating the lanes' public surface and hiding their defining files.

**Required alternative:** consumers use the lane services directly. Shared HTTP plumbing stays in a module-internal transport service that is not exported.

## Unrelated shared base classes

**Banned:** uniting services with unrelated jobs under one base because they share syntax, asynchronous shape, or folder location.

**Why:** superficial similarity couples unrelated failure and lifecycle semantics. Persistence, secrets, merging, and probing do not become one family through inheritance.

**Required alternative:** use a template-method base only within one lane family whose bookkeeping and failure semantics are genuinely identical. The base owns shared mechanics, remains DI-free and unregistered, and subclasses implement only the differing snapshot work.

## Docblock-driven contract changes

**Banned:** changing guard or catch behavior to match a class docblock without reading consumers.

**Why:** docblocks drift, while defensive wrapping and throw expectations at call sites reveal the observed contract.

**Required alternative:** inspect every call site and align documentation with evidence. Report an intentional contract change before modifying consumers or existing tests.

## Review checklist

- No rename-only function, lane façade, or multi-domain method remains.
- Shared transport stays internal and lanes remain the public surface.
- Inheritance is limited to one family with identical mechanics.
- Failure semantics are derived from consumers rather than stale documentation.
