# File Placement Convention

**Required.** Use this document when creating, moving, splitting, or sharing functions, constants, or other modules.

## One named exported function per file

Each named exported function lives in its own file named after what it defines: the function itself for helper modules, or the primary domain noun for domain-role modules such as a `.tool.ts` module. Use kebab-case plus the role suffix that declares the module's role.

A function file exports exactly one named function. Multi-function files become utility drawers that hide where behavior lives and make imports opaque.

Private, unexported helpers stay inside their consumer file when they serve exactly that caller. Extracting them creates wrapper indirection and file count without adding information.

Prefer pure, stateless functions that take input and return output without side effects or external state. Side effects belong to the caller or to a module whose explicit role is that effect, never inside a function that also computes.

## Constants group by theme

Constants live together in one `.constant.ts` file per concern. Do not create one file per constant; constant values are data, not behavior, so the one-function-per-file rule does not apply.

A themed constants file is itself one concern per file. It contains one domain of values that change together and never unrelated themes. Constants are not mixed into function or model files. Once a handful of values belong to a single concern, promote them into their themed constants file.

## Co-location follows real consumers

A file lives next to its consumer unless unrelated areas of the codebase import it. Shared means imported from more than one unrelated area, not merely conceptually reusable.

Before relocating a file, list every importer. A second unrelated area proves shared status; guessing from the current apparent consumer can break unrelated coverage and produce review-time churn.

Helpers live in a `helpers/` folder parallel to their consumer. Resources shared across a whole area live in a `shared/` folder split by role. Only files used across the entire codebase belong in a top-level shared directory.

One concern does not justify splitting a file when the operation is trivial, private, or already clearly owned. Extraction must improve ownership or purity, not only reduce line count.

## Moves are complete

When a unit moves, update every direct import and co-located type or approved test path, remove the stale location, and leave no compatibility forwarder. Review immediate consumers and formerly local siblings because a change can alter the correct owner or turn a local unit into a shared one.

## Prose examples

- A parser used by one feature stays in that feature's helpers folder. It moves only when actual unrelated importers appear.
- Several retry-limit values used by one queue concern share a retry-policy constants file; an unrelated HTTP timeout does not join that file.
- A private formatting branch remains inside its sole caller. A pure substantive transformation used across areas earns its own function file.

## Completion checklist

- Every named exported function has one intention-named file.
- Private sole-consumer functions remain private and co-located.
- Constants files group one theme without becoming drawers.
- Consumer scope was verified through imports rather than assumed.
- Moves update all direct paths and leave no stale location or forwarder.
