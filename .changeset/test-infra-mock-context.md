---
"@triplef.io/dashboard": patch
---

- Test infrastructure refactored: App, DebugSection, TabMenu, Chat, and Dlq specs now mount through a shared `mockAppViewContext` helper and install a memory router where RouterLinks are rendered
- App spec mirrors the route into the app store via a memory router; debug/tab-menu specs provide the app view context through the injection key
