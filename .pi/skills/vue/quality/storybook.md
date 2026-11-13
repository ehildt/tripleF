# Storybook Convention

**Consent-gated.** Creating or updating any story file requires explicit user consent. Stories are visual documentation for orchestrators and stateful widgets; they are not a substitute for behavioral tests.

Official reference: [Storybook documentation](https://storybook.js.org/docs).

## Eligibility and placement

Orchestrators and interactive widgets receive stories because their visual states document their behavior and composition. Pure presentational leaves do not receive individual stories: their visual states are exercised through the parent's story or approved spec, and per-leaf stories add Storybook navigation without adding equivalent documentation value.

A `.stories.ts` file is co-located with its component and uses the component's name plus the stories role suffix. Component and group renames update the story filename, title, imports, and documentation together as required by the [component-group convention](../conventions/component-group.md).

## Story file structure

Declare the story metadata with `satisfies Meta<typeof Component>` so it remains component-aware. Its conventions are:

- The `title` mirrors the component-group folder hierarchy as a readable path.
- `tags` includes `autodocs`, and `parameters.docs.description.component` contains prose explaining what the component is and does.
- `argTypes` declares controls for props that represent meaningful visual states.
- `args` provides a sensible representative state.
- Event handlers use Storybook's `fn()` test utility so interactions appear in the actions panel.
- Every exported story represents a named visual state and has a JSDoc line describing what the reader sees.

Container components that read stores can render in isolation because the shared Storybook preview registers a fresh Pinia for each story. Do not add local Pinia setup to each story.

## Name visual states

Names describe exactly what the reader sees rather than using a generic default or appending a redundant state suffix.

- Prefer Closed over Default for a dismissed control.
- Prefer Open over Active when visibility is the demonstrated state.
- Prefer a specific unavailable-model name over a generic error name.
- Loading is sufficient without an additional state suffix.
- A disabled story that demonstrates a hover blink includes both facts in its name.

## Prose examples

- An orchestrator story presents an empty, populated, and unavailable-model composition to document its wiring under those visual conditions.
- A dropdown story documents open and closed appearances. A test, when approved separately, verifies that keyboard dismissal actually closes it.
- A pure row does not receive its own story when every one of its states already appears in the parent list's stories.

## Completion checklist

- Consent exists for every created or updated story.
- Only orchestrators and stateful widgets receive stories; pure leaves do not.
- The file and readable title reflect the component's actual group and name.
- Metadata, documentation, controls, default arguments, and action capture describe the visual contract.
- Each exported story is a specifically named visual state with a short documentation line.
- Store-backed containers rely on the shared fresh-Pinia preview rather than local setup.
- No story is presented as a replacement for behavioral test coverage.
