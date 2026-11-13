# Pure Helper Convention

**Required.** Use this guide when extracting parsing, validation, normalization, formatting, calculation, key building, or another pure transformation. Read [wrapper-and-relay anti-patterns](../anti-patterns/wrappers-and-relays.md) with it. Generic helper and type rules are canonical in [code-structure](../../code-structure/SKILL.md).

## What earns a helper

A helper takes input and returns output without side effects or external state. It must not read or write refs, stores, DOM, storage, clocks, or network. It performs substantive pure computation that would otherwise sit inside a component, store, or composable.

Review parsing, validation, defaulting, normalization, key building, and similar transformations throughout the approved scope, not only obvious persisted-value parsers. Do not extract a function merely to reduce file size. Owner-level getters and mutations, trivial inline operations, and private functions serving one caller remain with their owner.

Storage writes and other effects belong to the owning store action or watcher, composable workflow, or API module. Moving an effect into a helper-named file does not make it pure.

## One function and one location

Each helper file exports exactly one named function. Name the kebab-case file after that function and apply the helper role suffix; `strip-html.helper.ts` exports `stripHtml`. Function names describe what they compute or format: formatters identify the result, calculations identify the calculation, and predicates use a readable state or possession prefix. Names such as `formatContextUsagePercent`, `calcTokenPercent`, and `isConversationExpired` demonstrate the convention.

Place helpers in a helpers folder co-located with their consumer, parallel to composables. Helpers shared across a component group live in the group's shared-helpers folder. Only unrelated consumers across the codebase justify a top-level shared location. Never leave loose helper files at a group root or create a general utility drawer.

Parameters and returns are explicitly typed. Local function shapes are named in the function file; exported shapes follow the producer-owned co-located types convention in code-structure.

## Wrapper decision

Inline a single call when the existing store, prop, or utility name already says what it does. If a value needs domain intent or reuse, name the resulting binding rather than wrapping one access in a function. Promote a predicate to a tested helper only when it has domain meaning across consumers.

Keep functions that perform real branching, defaulting, type narrowing, or other meaningful work. Dependency injection that decouples a leaf from a store or composable also earns its name. Coercion followed by one delegated call does not. See [wrappers and relays](../anti-patterns/wrappers-and-relays.md) for the complete decision rule and exceptions.

## Localization boundary

A helper never imports the translation runtime or receives a translate function. It returns the translation key and interpolation parameters, and the caller performs the translation through its existing `useI18n` binding or the `i18n` singleton.

This keeps the transformation pure, prevents key namespaces from scattering into unrelated files, and lets specs assert keys without mocking the localization runtime. The locale schema test guarantees that returned keys exist. Return only fields a consumer actually reads; an unread display field is dead surface even when its type is valid. Follow the [localization skill](../../localization/SKILL.md) for key ownership and validation.

## Prose examples

- A function that normalizes a persisted selection from supplied text is a helper candidate. A function that reads storage to obtain that text is a workflow or owner operation, not a pure helper.
- A predicate with domain meaning and type narrowing earns a tested helper. A function that only calls a store's existing read method is inlined at the consumer.
- A display helper returns a localization key plus count parameters. Its caller translates them; the helper does not receive the translator.
- A named computed result can communicate repeated domain intent without introducing a one-line function wrapper.

## Quality and placement audit

Every helper is required to have a co-located helper spec named after the helper plus the `.spec.ts` suffix, producing the `.helper.spec.ts` role combination. The spec exercises inputs and outputs directly without mounting a component. Creating or updating that spec still requires explicit user consent; without consent, report the required coverage rather than creating the file.

After implementation, repeat the placement and purity review for touched stores, composables, helpers, private functions, and immediate consumers. Move misplaced units without forwarders and update direct imports and co-located coverage. Complete the canonical [placement audit](../../code-structure/quality/placement-audit.md).

## Completion checklist

- The file exports one substantive pure function named after its computation.
- It reads no external state and performs no side effect.
- Its location reflects actual consumers, and its types follow code-structure.
- It adds domain meaning rather than renaming or relaying one call.
- Display localization remains with the caller through returned keys and parameters.
- Every returned field has a consumer.
- Required co-located coverage is present or explicitly reported pending consent.
