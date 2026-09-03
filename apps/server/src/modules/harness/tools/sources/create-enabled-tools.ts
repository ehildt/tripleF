import type { ToolDependencies } from '@triplef/agent/tools';
import { createBrightDataImageSearch } from '@triplef/agent/tools';
import { createBrightDataNewsSearch } from '@triplef/agent/tools';
import { createBrightDataPlacesSearch } from '@triplef/agent/tools';
import { createBrightDataShoppingSearch } from '@triplef/agent/tools';
import { createBrightDataVideoSearch } from '@triplef/agent/tools';
import { createBrightDataWebSearch } from '@triplef/agent/tools';
import { createBrightDataWebpageScrape } from '@triplef/agent/tools';
import { createSerperBusinessReviewsSearch } from '@triplef/agent/tools';
import { createSerperImageSearch } from '@triplef/agent/tools';
import { createSerperNewsSearch } from '@triplef/agent/tools';
import { createSerperPlacesSearch } from '@triplef/agent/tools';
import { createSerperShoppingSearch } from '@triplef/agent/tools';
import { createSerperVideoSearch } from '@triplef/agent/tools';
import { createSerperWebSearch } from '@triplef/agent/tools';
import { createSerperWebpageScrape } from '@triplef/agent/tools';
import { createVariantRequestTool } from '@triplef/agent/tools';
import { withSummary } from '@triplef/agent/tools';
import { createWebFetchTool } from '@triplef/agent/tools';
import { createYoutubeVideoSearch } from '@triplef/agent/tools';
import type { ToolSet } from 'ai';

import { createEodhdFundamentals } from './eodhd/fundamentals.tool.js';
import { createEodhdHistory } from './eodhd/history.tool.js';
import { createEodhdIntraday } from './eodhd/intraday.tool.js';
import { createEodhdNews } from './eodhd/news.tool.js';
import { createEodhdQuote } from './eodhd/quote.tool.js';
import { createEodhdSearch } from './eodhd/search.tool.js';
import { createEodhdTechnical } from './eodhd/technical.tool.js';

function addBrightDataTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.brightData.apiKey || !cfg.brightData.serpZone) return;
  const { brightData } = cfg;
  if (brightData.web.enabled)
    tools.brightDataWebSearch = withSummary(createBrightDataWebSearch(deps));
  if (brightData.images.enabled)
    tools.brightDataImageSearch = withSummary(
      createBrightDataImageSearch(deps),
    );
  if (brightData.news.enabled)
    tools.brightDataNewsSearch = withSummary(createBrightDataNewsSearch(deps));
  if (brightData.places.enabled)
    tools.brightDataPlacesSearch = withSummary(
      createBrightDataPlacesSearch(deps),
    );
  if (brightData.shopping.enabled)
    tools.brightDataShoppingSearch = withSummary(
      createBrightDataShoppingSearch(deps),
    );
  if (brightData.videos.enabled)
    tools.brightDataVideoSearch = withSummary(
      createBrightDataVideoSearch(deps),
    );
  if (brightData.scrape.enabled)
    tools.brightDataWebpageScrape = withSummary(
      createBrightDataWebpageScrape(deps),
    );
}

function addSerperTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.serper.apiKey) return;
  const { serper } = cfg;
  if (serper.web.enabled)
    tools.serperWebSearch = withSummary(createSerperWebSearch(deps));
  if (serper.images.enabled)
    tools.serperImageSearch = withSummary(
      createSerperImageSearch(deps),
      (data) => {
        const results = data.results as
          | Array<{ imageUrl?: string; title?: string; source?: string }>
          | undefined;
        if (!Array.isArray(results)) return {};
        return {
          resultCount: results.length,
          imageUrls: results
            .slice(0, 6)
            .map((r) => r.imageUrl)
            .filter(
              (url): url is string => typeof url === 'string' && url.length > 0,
            ),
          sources: [
            ...new Set(
              results.map((r) => r.source).filter((s): s is string => !!s),
            ),
          ],
        };
      },
    );
  if (serper.news.enabled)
    tools.serperNewsSearch = withSummary(createSerperNewsSearch(deps));
  if (serper.places.enabled)
    tools.serperPlacesSearch = withSummary(createSerperPlacesSearch(deps));
  if (serper.shopping.enabled)
    tools.serperShoppingSearch = withSummary(createSerperShoppingSearch(deps));
  if (serper.reviews.enabled)
    tools.serperBusinessReviewsSearch = withSummary(
      createSerperBusinessReviewsSearch(deps),
    );
  if (serper.videos.enabled)
    tools.serperVideoSearch = withSummary(createSerperVideoSearch(deps));
  if (serper.scrape.enabled)
    tools.serperWebpageScrape = withSummary(createSerperWebpageScrape(deps));
}

function addEodhdTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.eodhd?.apiKey) return;
  const { eodhd } = cfg;
  if (eodhd.search.enabled)
    tools.eodhdSearch = withSummary(createEodhdSearch(deps));
  if (eodhd.quote.enabled)
    tools.eodhdQuote = withSummary(createEodhdQuote(deps));
  if (eodhd.history.enabled)
    tools.eodhdHistory = withSummary(createEodhdHistory(deps));
  if (eodhd.technical.enabled)
    tools.eodhdTechnical = withSummary(createEodhdTechnical(deps));
  if (eodhd.intraday.enabled)
    tools.eodhdIntraday = withSummary(createEodhdIntraday(deps));
  if (eodhd.news.enabled) tools.eodhdNews = withSummary(createEodhdNews(deps));
  if (eodhd.fundamentals.enabled)
    tools.eodhdFundamentals = withSummary(createEodhdFundamentals(deps));
}

function addYoutubeTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.youtube.apiKey) return;
  if (cfg.youtube.videos.enabled)
    tools.youtubeVideoSearch = withSummary(createYoutubeVideoSearch(deps));
}

function addVariantTools(tools: ToolSet, enabledVariants: string[]): void {
  const variantMap: Record<
    string,
    () => ReturnType<typeof createVariantRequestTool>
  > = {
    grayscale: () => createVariantRequestTool('grayscale'),
    denoised: () => createVariantRequestTool('denoised'),
    sharpened: () => createVariantRequestTool('sharpened'),
    clahe: () => createVariantRequestTool('clahe'),
  };

  for (const variant of enabledVariants) {
    const factory = variantMap[variant];
    if (!factory) continue;
    const toolName = `request${variant.charAt(0).toUpperCase() + variant.slice(1)}`;
    (tools as Record<string, unknown>)[toolName] = factory();
  }
}

export function createEnabledTools(
  deps: ToolDependencies,
  enabledVariants?: string[],
): ToolSet {
  const tools: ToolSet = {};

  tools.webFetch = withSummary(createWebFetchTool());

  const cfg = deps.getLiveConfig();
  const { serper, brightData } = cfg;

  addSerperTools(tools, deps, serper.enabled, cfg);
  addBrightDataTools(tools, deps, brightData.enabled, cfg);
  addEodhdTools(tools, deps, cfg.eodhd?.enabled ?? false, cfg);
  addYoutubeTools(tools, deps, cfg.youtube.enabled, cfg);
  addVariantTools(tools, enabledVariants ?? []);

  return tools;
}
