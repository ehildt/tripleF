---
'@triplef/dashboard': patch
---

Consolidate the preprocessing panel and de-duplicate the settings actions bar.

Extract the image-preview cluster out of `PprocToolsPanel` into a self-contained `PprocImagePreview` component that owns the trigger button, hidden file input, shared lightbox, and repick action together with its preview composable; the panel shrinks to the actions bar plus its three sections. Introduce a shared `PanelActions` bar (end-aligned radiant gradient) and adopt it across the preprocessing panel and the system/tab-menu/toast/playlist settings panels, removing five copy-pasted CSS blocks.

Normalize the preprocessing store import to the `@/` alias and drop the now-invalid compiler-macro imports (`defineProps`, `defineEmits`) that `@vue/compiler-sfc` no longer accepts.
