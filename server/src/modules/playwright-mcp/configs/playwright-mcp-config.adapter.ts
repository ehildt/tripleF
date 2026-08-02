import { getBooleanEnv } from '@ehildt/ckir-helpers/get-boolean-env';
import Joi from 'joi';

/**
 * The sidecar URL and the optional client-side tool allow-list. The default
 * allow-list lives in `BROWSER_TOOL_NAMES` (harness tool registry).
 */
export interface PlaywrightMcpConfig {
  enabled: boolean;
  url: string;
  tools?: string[];
}

export const PlaywrightMcpConfigSchema = Joi.object<PlaywrightMcpConfig>({
  enabled: Joi.boolean().required(),
  url: Joi.string().uri().required(),
  tools: Joi.array().items(Joi.string()).min(1).optional(),
}).required();

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
