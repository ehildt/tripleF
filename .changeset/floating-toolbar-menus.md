---
"@triplef.io/dashboard": patch
---

- Expandable toolbar menus (conversation list, subscribed events) now teleport to the body as floating dropdowns anchored below their divider — no longer hidden behind the chat column or video popouts (z-index aligned with the model-select menu, re-anchoring on scroll, resize, and toolbar reflow)
- Menu positioning hardened for lists that mount already-expanded (persisted open state): coordinates resolve on mount, no toggle required
- Content copy button for assistant responses (markdown-rendered exchanges to clipboard)
- App header and footer updated
- Model-select dropdown anchors correctly while tracking trigger position on open/scroll/resize
