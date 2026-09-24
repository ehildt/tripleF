---
'@triplef/dashboard': patch
---

Migrate the chat left toolbar to store-based architecture. New Pinia stores own the toolbar state: `useLeftToolbarStore` (exclusive menus, model selection incl. vision/numCtx sync, conversation list + subscriptions, new-conversation draft, stream mode, disabled-feedback blink) and `useAttachedFilesStore` (pending-file map, replacing the hand-rolled module state file). Removed the provide/inject context, the `onClickOutside` coordinator (menus now self-close via a teleported backdrop, matching the slide-over/lightbox pattern), and the `defineExpose` template-ref plumbing — `Chat.vue` reads the stores directly and owns the hidden file input. Toolbar leaves are now purely presentational (props in / events out); the three group components are the containers that read the stores. Also fixes a latent jsdom test gap by mocking `URL.createObjectURL`/`revokeObjectURL` in the attached-files spec.
