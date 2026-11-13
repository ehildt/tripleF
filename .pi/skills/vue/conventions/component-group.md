# Component Group Convention

**Required.** Use this guide when creating, moving, renaming, or reviewing a component group or its shared resources. Generic placement and naming rules are canonical in [code-structure](../../code-structure/SKILL.md); this guide defines their Vue-specific form. Review [wrappers and relays](../anti-patterns/wrappers-and-relays.md) before introducing aggregation boundaries.

## Group identity and layout

A component group has exactly one main orchestrator at the root of the group folder. The orchestrator is a sibling of its subcomponent folders, not nested inside one of them and not left outside the group. The folder name is the kebab-case form of the orchestrator's component name and describes its actual purpose.

Every component has its own folder, even a simple shared primitive. Subcomponents live inside their parent's folder, and a sub-orchestrator follows the same layout recursively. The main component's co-located types, approved spec, approved stories, composables, helpers, and child folders make the group self-describing.

For example, a chat group contains the chat orchestrator at its root and child groups for its toolbar, exchange list, and input. A group whose orchestrator is named ChatExchangeList uses an exchange-list folder, not a vague exchange or exchanges folder.

## Co-locate by actual consumers

A file belongs next to its consumer unless unrelated areas import it. Before moving a supposedly local file, list every importer; a second unrelated consumer makes it shared. Do not infer sharing from conceptual similarity.

- Group-local composables live in the group's `composables/` folder, parallel to `helpers/`.
- Group-local helpers live in a `helpers/` folder beside their consumer, one exported function per file.
- Resources shared across a whole component group live in `shared/ui/`, `shared/composables/`, and `shared/helpers/` according to role.
- If only UI components are shared, name the folder `ui/` rather than introducing a generic shared drawer.
- Only composables and helpers used across unrelated areas of the codebase belong in top-level shared locations such as `src/composables/`.
- A shared composable never imports feature-local code. Move a composable with feature-local dependencies into that feature rather than passing those dependencies through a component.

There are no loose helper or composable files at a component-group root. Each component's props type sits beside that component. Specs and stories sit beside the unit they cover when their creation or modification has been approved.

## File and symbol naming

| Artifact | Convention |
| --- | --- |
| Component | PascalCase noun phrase; matching kebab-case component folder |
| Props type | Component-named co-located `.types.ts` file exporting the named props interface |
| Composable | Kebab-case file beginning with the `use-` prefix; function names what it manages |
| Store | Domain-concept file; setup-store function uses the store naming convention |
| Helper | Function-named kebab-case `.helper.ts` file |
| Spec | Covered unit's name with the `.spec.ts` role suffix |
| Story | Component's name with the `.stories.ts` role suffix |

Boolean values use readable state prefixes, actions use verb-plus-noun names, event handlers identify the event they handle, and cleanup functions name both the resource and cleanup action. Pure functions name what they compute: formatters identify the formatted result, calculations identify the calculation, and predicates use a state or possession prefix. See each unit's convention for its detailed contract.

## Rename all or nothing

When renaming a component or group, update the complete identity in one pass:

- The component file and group folder.
- Co-located types, specs, and stories.
- The scoped BEM block prefix, Storybook title, imports, and usages.
- Data attributes and prose comments that contain the old name.
- Deep selectors and DOM query strings targeting the old classes.

Finish by searching the dashboard source for the old identifier and confirming zero matches. DOM queries and deep selectors fail silently after a partial rename, so type-checking alone is insufficient.

Moves are equally complete: update every direct import and co-located path, remove the stale location, and do not leave compatibility forwarders or barrels.

## Placement audit after implementation

Before lint or test gates, review all touched stores, composables, helpers, private functions, and immediate consumers across the whole approved scope. Check actual ownership, consumer scope, and purity rather than only new files or obvious parsers.

Stores retain shared data and owner-level synchronous APIs. Composables own lifecycle and workflows. Helpers contain substantive pure computation. Widget state follows its primary owner, and storage, network, clock, or DOM effects never become disguised pure helpers. Move misplaced units without forwarders and report any deliberate exception. Complete the canonical [placement audit](../../code-structure/quality/placement-audit.md).

## Completion checklist

- The root orchestrator and group folder share the same intentional identity.
- Every component and sub-orchestrator has the correct nested folder.
- Composables, helpers, types, specs, and stories are co-located by real consumer scope.
- Shared folders are role-divided and contain only genuinely shared resources.
- No barrel, stale path, compatibility forwarder, or old identifier remains.
- The post-implementation placement and purity audit covers all touched units and consumers.
