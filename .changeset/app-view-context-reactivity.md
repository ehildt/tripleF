---
"@triplef.io/dashboard": patch
---

- App view context now provides store-derived data as computed refs instead of one-time unwrapped values, so route views react to store changes (e.g. selecting a debug request updates the details panel, and models appear in the DLQ selector once they finish loading)
- Debug section details panel updates reactively when a request is selected
