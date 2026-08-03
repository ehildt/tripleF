---
name: playwright
description: Playwright MCP browser-automation tools for AI models. Use when working with browser_* harness tools, the playwright-mcp compose sidecar, MCP client config, debugging sidecar connectivity (host-header, DNS gotchas), or curating/extending the exposed browser tool set.
---

# Playwright Browser Tools (MCP Sidecar)

Browser automation for the harness's AI models via the official [Playwright MCP](https://github.com/microsoft/playwright-mcp) server. The model drives a headless chromium through `browser_*` tools; page content arrives as accessibility-tree snapshots, so no vision model is required.

## Architecture (read before changing anything)

`playwright-mcp` sidecar container → `PlaywrightMcpClientService` (AI SDK `createMCPClient`, HTTP transport) → cached `ToolSet` merged by `ToolSelectionService` → intent classifier picks `browser_*` names → execute step chains calls (8-step budget for browser intents only).

| Concern                                          | File                                                                                                           |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| Sidecar service                                  | `compose.yml` (`playwright-mcp`)                                                                                |
| pi agent access                                  | `.pi/mcp.json` (`pi-mcp-extension` config; server `playwright`, streamable-http, eager)                          |
| Env config (enabled/url/allow-list)              | `server/src/modules/playwright-mcp/configs/playwright-mcp-config.adapter.ts` (+ `.service.ts`)                  |
| MCP client (connect, cache, filter, deny-list)   | `server/src/modules/playwright-mcp/services/playwright-mcp-client.service.ts`                                   |
| Tool vocabulary (names, descriptions, allow-list)| `server/src/modules/harness/helpers/tool-registry.constants.ts` (`BROWSER_TOOL_NAMES`)                          |
| Enabled-tool gating                              | `server/src/modules/harness/helpers/get-enabled-tool-names.helper.ts`                                           |
| Classifier/UI categories                         | `categorize-tools.helper.ts`, `resolve-tool-category.helper.ts` (same folder)                                   |
| Tool merging                                     | `server/src/modules/ai-sdk/services/tool-selection.service.ts`                                                  |
| Step budget                                      | `server/src/modules/harness/actions/execute.action.ts` (`BROWSER_MAX_STEPS`), `ai-sdk.service.ts` (`maxSteps`)  |

## Quick Rules

1. **Dangerous tools stay denied.** Never allow `browser_run_code*` or `browser_evaluate` (RCE-equivalent: arbitrary JS in the MCP server process) or `browser_file_upload` (reads absolute paths off the sidecar filesystem). The deny-list in `PlaywrightMcpClientService` overrides every allow-list.
2. **`--allowed-hosts` entries must match the Host header verbatim — port included.** `playwright-mcp` alone yields `403 "Access is only allowed at …"`; use `playwright-mcp:8931,localhost:8931`.
3. **`localhost` inside the sidecar is the sidecar.** Models must address project services by container name (`http://dashboard:5173`, `http://server:3000`), never `localhost`. Same for your own prompts when testing.
4. **The dashboard is served under `/dashboard/` (vite `base`), not `/`.** Navigating to a bare root (`http://dashboard:5173` or `/`) returns `403 Forbidden`. From the sidecar, always open `http://dashboard:5173/dashboard/`.
4. **Internal-only networking.** The sidecar lives on the `triplef.io` network; the single exception is the loopback-only port publish `127.0.0.1:8931:8931`, which exists so host-side MCP clients (pi via the `pi-mcp-extension` package, configured in `.pi/mcp.json`) can reach it as `http://localhost:8931/mcp`. Never publish on `0.0.0.0` or weaken `--isolated`/`--headless`/`--no-sandbox` without an explicit user request.
5. **Search stays cheap.** Search tools run single-step; only browser intents get the 8-step budget (`BROWSER_MAX_STEPS`). Do not raise the default tool path.
6. **Browser state persists across chats** (in-memory isolated profile; lost only on sidecar restart). The model can `browser_close`, or restart the container to reset.

## Operations

```bash
docker compose up -d playwright-mcp                   # start / first pull of mcr.microsoft.com/playwright/mcp
docker logs playwright-mcp                            # MCP requests hitting the sidecar
docker logs server 2>&1 | grep "browser tools"        # expect: Connected to http://playwright-mcp:8931/mcp — N browser tools exposed
docker compose restart server                         # re-read server/.env, reconnect at bootstrap
```

Env knobs (`server/.env`; recreate the server container after changes):

- `PLAYWRIGHT_MCP_ENABLED=false` — full off-switch; the harness degrades gracefully to pre-MCP behavior.
- `PLAYWRIGHT_MCP_URL=http://playwright-mcp:8931/mcp` — sidecar endpoint.
- `PLAYWRIGHT_MCP_TOOLS=browser_navigate,browser_snapshot` — comma allow-list override narrowing the exposed set (deny-list still applies).

## Using it (manual test prompts)

Browse explicitly so the intent classifier prefers `browser_*` over the cheaper search/fetch tools:

```
open https://example.com and tell me the page heading
open the hacker news front page and summarize the top 5 stories
go to https://demo.playwright.dev/todomvc, add two todos, and check the counter
open http://dashboard:5173/dashboard/ and report any console errors or failed network requests
```

## Reaching the dashboard from the sidecar

- Use the container hostname: `http://dashboard:5173/dashboard/`.
- The `/dashboard/` path prefix comes from vite's `base` in `dashboard/vite.config.ts`; a root URL returns `403`, and the proxy target is read from `VITE_PROXY_TARGET` (default `http://localhost:3000`).
- If a page loads but shows `403 Forbidden`, you hit the wrong path/root, not an app error — retry with `/dashboard/`.

## Extending the tool set

1. Expose more MCP tools: add the `browser_*` name to `BROWSER_TOOL_NAMES` **and** a capability-shaped description (when to use vs. search/fetch — the classifier learns the tool from its description alone) in `TOOL_DESCRIPTIONS` (`tool-registry.constants.ts`). Capability-gated groups (`pdf`, `vision`, `storage`, `network`) additionally need `--caps <group>` in the sidecar command.
2. After registry changes run `cd server && pnpm lint && npx tsc --noEmit && pnpm test`.
3. Tests are deferred per the nestjs skill: implement, ask the user to verify manually, then offer `.spec.ts` coverage as a separate step.

## Checklist

- [ ] Server log shows `Connected to http://playwright-mcp:8931/mcp — N browser tools exposed`
- [ ] Deny-list intact — no `browser_run_code*`/`browser_evaluate`/`browser_file_upload` exposed **to the harness models** (pi-side MCP tools are governed by pi itself; pi already has unrestricted `bash`)
- [ ] `--allowed-hosts` entries include the port
- [ ] Test prompts use container hostnames, not `localhost`
- [ ] Dashboard URLs include the `/dashboard/` base path (`http://dashboard:5173/dashboard/`)
- [ ] Only loopback port published (`127.0.0.1:8931:8931`), nothing on `0.0.0.0`
- [ ] Search/intent path still single-step; only browser intents get `BROWSER_MAX_STEPS`
