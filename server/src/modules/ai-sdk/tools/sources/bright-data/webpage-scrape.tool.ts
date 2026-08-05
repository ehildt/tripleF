import { tool } from 'ai';
import { z } from 'zod';

import { requestBrightData } from '../bright-data-client.js';
import { BRIGHT_DATA_TIMEOUT_MS } from '../search-timeout.js';
import type { ToolDependencies } from '../types.js';

export function createBrightDataWebpageScrape(deps: ToolDependencies) {
  return tool({
    description:
      'Fetch and render a full webpage using Bright Data Web Unlocker API. Returns clean Markdown text with its title. Use for pages behind anti-bot protection that plain fetch cannot reach.',
    inputSchema: z.object({
      url: z.string().describe('The URL to fetch and render'),
    }),
    execute: async ({ url }: { url: string }) => {
      const cfg = deps.getLiveConfig().brightData;
      if (!cfg.enabled || !cfg.apiKey || !cfg.unlockerZone) {
        return {
          content: '',
          error: 'Bright Data webpage scrape is not enabled',
        };
      }
      if (!cfg.scrape.enabled) {
        return {
          content: '',
          error: 'Bright Data webpage scrape is not enabled',
        };
      }

      deps.logger.log(`Bright Data webpage scrape for "${url}"`);
      try {
        const data = (await requestBrightData(
          cfg.apiKey,
          cfg.unlockerZone,
          url,
          { markdown: true, timeoutMs: BRIGHT_DATA_TIMEOUT_MS },
        )) as { text?: string };
        const content = data.text || '';
        deps.logger.log(
          `Bright Data webpage scraped ${content.length} chars from "${url}"`,
        );
        return { content: content.slice(0, 8000), title: '' };
      } catch (err) {
        deps.logger.warn(
          `Bright Data webpage scrape failed for "${url}": ${String(err)}`,
        );
        return { content: '', error: String(err) };
      }
    },
  });
}
