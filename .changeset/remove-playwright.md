---
"@triplef/agent": major
"@triplef/server": patch
"@triplef/dashboard": patch
---

Remove Playwright and browser automation throughout the workbench.

BREAKING: `BROWSER_TOOL_NAMES`, every `browser_*` tool description, and the shared `ProviderConfig` export are gone from `@triplef/agent/schemas`. The server no longer connects to a Playwright MCP sidecar or offers browser tools to models. The dashboard no longer includes Playwright-backed Vitest browser projects or the Storybook Vitest addon; its remaining tests run in jsdom.
