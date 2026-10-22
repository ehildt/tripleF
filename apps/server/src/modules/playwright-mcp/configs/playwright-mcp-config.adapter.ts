import { getBooleanEnv } from '@triplef/helpers/get-boolean-env';
import { z } from 'zod';

/**
 * The sidecar URL and the optional client-side tool allow-list. The default
 * allow-list lives in `BROWSER_TOOL_NAMES` (harness tool registry).
 */
export const PlaywrightMcpConfigSchema = z.strictObject({
  enabled: z.boolean(),
  url: z.url(),
  tools: z.array(z.string()).min(1).optional(),
});

/** Validated playwright-mcp config shape — derived from the schema. */
export type PlaywrightMcpConfig = z.infer<typeof PlaywrightMcpConfigSchema>;

export function PlaywrightMcpConfigAdapter(
  env = process.env,
): PlaywrightMcpConfig {
  const tools = env.PLAYWRIGHT_MCP_TOOLS?.split(',')
    .map((name) => name.trim())
    .filter(Boolean);

  return {
    enabled: getBooleanEnv(env.PLAYWRIGHT_MCP_ENABLED, false)!,
    url: env.PLAYWRIGHT_MCP_URL ?? 'http://localhost:8931/mcp',
    tools: tools?.length ? tools : undefined,
  };
}
