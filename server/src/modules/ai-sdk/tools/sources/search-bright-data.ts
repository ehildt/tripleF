import { applyLocaleParams } from './apply-locale-params.helper.js';
import {
  applyRecencyParam,
  type SearchRecency,
} from './apply-recency-param.helper.js';
import { requestBrightData } from './bright-data-client.js';
import { BRIGHT_DATA_TIMEOUT_MS } from './search-timeout.js';
import type { ResultItem } from './sort-by-priority.js';
import type { ToolDependencies } from './types.js';

export async function searchBrightData(
  query: string,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
  deps: ToolDependencies,
  allResults: ResultItem[],
  lang?: string,
  recency?: SearchRecency,
): Promise<void> {
  const bright = cfg.brightData;
  if (!bright.enabled || !bright.apiKey || !bright.serpZone) return;
  if (!bright.web.enabled) return;

  try {
    deps.logger.log(`Bright Data web search for "${query}"`);
    const body: Record<string, unknown> = { q: query };
    applyLocaleParams(body, lang);
    applyRecencyParam(body, recency);
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined || value === null) continue;
      search.set(key, String(value));
    }
    search.set('num', String(bright.web.results));
    search.set('brd_json', '1');

    const data = (await requestBrightData(
      bright.apiKey,
      bright.serpZone,
      `https://www.google.com/search?${search.toString()}`,
      { timeoutMs: BRIGHT_DATA_TIMEOUT_MS },
    )) as {
      organic?: Array<{ title: string; link: string; description: string }>;
    };

    const organic = data.organic ?? [];
    if (!organic.length) return;

    for (const r of organic) {
      allResults.push({
        title: r.title,
        snippet: (r.description || '').slice(0, 300),
        url: r.link,
        source: 'brightData',
      });
    }

    deps.logger.log(
      `Bright Data returned ${organic.length} results for "${query}"`,
    );
  } catch (err) {
    deps.logger.warn(
      `Bright Data web search failed for "${query}": ${String(err)}`,
    );
  }
}
