---
"@triplef/dashboard": patch
---

Migrate the dashboard's remaining Tailwind utility classes to component-owned plain CSS with BEM class names, covering panels, panel headings, conversation icons, DLQ actions and status badges, and Storybook examples. Keep Tailwind's PostCSS integration and Preflight reset in place, remove stale utility selectors, and document the plain-CSS convention.

Resolves #121.
