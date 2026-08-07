---
"@triplef.io/dashboard": patch
---

- New shared `SysCtlSection` component (loading/error/panel layout) reused by the preprocessing and search-engines sections, replacing duplicated per-section state markup
- SearchEnginesSection refactored onto `PanelLayout` + `SysCtlSection`; panel header title simplified (chevron prefix removed)
