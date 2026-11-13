# Helper Extraction Convention

**Required.** Use this document when extracting a predicate or transformation or deciding whether simple server logic should remain inline. Review [service indirection](../anti-patterns/service-indirection.md).

## Pure helper boundary

Each helper lives in its own function-named `.helper.ts` file inside a co-located `helpers/` folder and exports exactly one named function.

Helpers are pure and stateless. They take supplied input and return output without NestJS decorators, injected dependencies, external state, or side effects. Logic needing injection belongs in a service.

Every helper requires a co-located `.helper.spec.ts` that directly exercises its inputs and outputs. Creating or updating that spec requires explicit consent; without consent, report the required coverage rather than creating it.

Import directly from the defining helper file. Do not add a barrel.

## Naming

Action functions use verb-plus-noun names. Predicate helpers use `is`, `has`, or `should`; formatting helpers identify what they format; calculation helpers identify what they calculate. Examples of intentional names include `isTrustedImageUrl`, `hasCompletedExchanges`, `formatContextUsagePercent`, and `calcTokenPercent`.

A helper file named `strip-html.helper.ts` exports the corresponding camel-case function `stripHtml`.

## Prefer inline simple patterns

Keep logic inline when it is simple and self-documenting:

- Use an inline arrow predicate in an iterator rather than a named wrapper that only renames the predicate.
- Use guard clauses and early returns instead of nesting an entire method body.
- Use a short ternary for a simple two-value assignment rather than a long branch whose only purpose is that assignment.
- Keep a single-statement return or throw concise when project formatting permits it.
- Do not extract a block immediately followed by a single assignment merely to give it another name.
- For more than three branches that map a type directly to an action, prefer an explicit typed lookup dispatch over a long sequential conditional chain.
- Combine simple iterator predicates in one flat filter when separate named filters add no domain meaning.
- Assign a computed result directly rather than introducing an intermediate boolean used only by one following branch.

These are readability guidelines, not permission to hide substantive domain behavior inside entry points. Ownership still wins over brevity.

## Wrapper decision

A function earns its name only if the call site cannot already see what it does. Inline a pure rename-wrapper or promote a meaningful cross-file domain predicate into a real helper with approved coverage.

Keep branching, defaulting, type narrowing, dependency decoupling, and side effects owned by the correct unit. Do not turn an impure operation into a helper merely to make it look simpler.

## Prose examples

- A job-shape predicate that only inspects supplied data earns a helper near its processor.
- A retry decision requiring persistence and configuration belongs to a lifecycle service, not a helper.
- A guard that immediately returns for absent input stays inline; a wrapper that only calls another function with a selected field is removed.

## Completion checklist

- The helper has one pure exported function and an intentional name and location.
- It has no decorator, injected dependency, external state, or side effect.
- Required helper coverage exists or is explicitly reported pending consent.
- Simple logic remains inline where extraction would add no information.
- No wrapper or barrel was introduced.
