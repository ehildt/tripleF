import type { ToolSet } from 'ai';

import {
  createBraveImageSearch,
  createBraveNewsSearch,
  createBraveVideoSearch,
  createBraveWebSearch,
} from './brave.js';
import { createBrowserbaseFetchTool } from './browserbase-fetch.tool.js';
import { createBrowserbaseSearchTool } from './browserbase-search.tool.js';
import { createBrowserbaseWebpageFetch } from './browserbase-webpage-fetch.tool.js';
import { createCombinedWebSearch } from './combined-web-search.tool.js';
import {
  createHackerNewsGetItem,
  createHackerNewsGetUser,
  createHackerNewsSearch,
} from './hackernews.js';
import { createVariantRequestTool } from './image-variants.tool.js';
import { createSearXngSearch } from './searxng.js';
import {
  createSerperImageSearch,
  createSerperNewsSearch,
  createSerperPlacesSearch,
  createSerperReviewsSearch,
  createSerperShoppingSearch,
  createSerperVideoSearch,
  createSerperWebpageFetch,
  createSerperWebSearch,
} from './serper.js';
import { summarizeFound, withSummary } from './tool-factory.js';
import type { ToolDependencies } from './types.js';
import { createWebFetchTool } from './web-fetch.tool.js';
import { createWikipediaGetPage, createWikipediaSearch } from './wikipedia.js';

function addCombinedWebSearch(
  tools: ToolSet,
  deps: ToolDependencies,
  hasAnySearch: boolean,
): void {
  if (hasAnySearch) {
    tools.webSearch = withSummary(createCombinedWebSearch(deps));
  }
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
    tools.serperReviewsSearch = withSummary(createSerperReviewsSearch(deps));
  if (serper.videos.enabled)
    tools.serperVideoSearch = withSummary(createSerperVideoSearch(deps));
  if (serper.webpageFetch.enabled)
    tools.serperWebpageFetch = withSummary(createSerperWebpageFetch(deps));
}

function addBraveTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.brave.apiKey) return;
  const { brave } = cfg;
  if (brave.web.enabled)
    tools.braveWebSearch = withSummary(createBraveWebSearch(deps));
  if (brave.images.enabled)
    tools.braveImageSearch = withSummary(
      createBraveImageSearch(deps),
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
  if (brave.news.enabled)
    tools.braveNewsSearch = withSummary(createBraveNewsSearch(deps));
  if (brave.video.enabled)
    tools.braveVideoSearch = withSummary(createBraveVideoSearch(deps));
}

function addSearxngTool(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  url?: string,
): void {
  if (enabled && url) {
    tools.searxngSearch = withSummary(createSearXngSearch(deps));
  }
}

function addBrowserbaseTools(
  tools: ToolSet,
  deps: ToolDependencies,
  enabled: boolean,
  cfg: ReturnType<ToolDependencies['getLiveConfig']>,
): void {
  if (!enabled || !cfg.browserBase.apiKey) return;
  const { browserBase: bbCfg } = cfg;
  if (bbCfg.search.enabled)
    tools.browserbaseSearch = withSummary(createBrowserbaseSearchTool(deps));
  if (bbCfg.fetch.enabled) {
    tools.browserbaseFetch = withSummary(createBrowserbaseFetchTool(deps));
    tools.browserbaseWebpageFetch = withSummary(
      createBrowserbaseWebpageFetch(deps),
    );
  }
}

function addWikipediaTools(tools: ToolSet, deps: ToolDependencies): void {
  tools.wikipediaSearch = withSummary(createWikipediaSearch(deps));
  tools.wikipediaGetPage = withSummary(
    createWikipediaGetPage(deps),
    summarizeFound,
  );
}

function addHackerNewsTools(tools: ToolSet, deps: ToolDependencies): void {
  tools.hackerNewsSearch = withSummary(createHackerNewsSearch(deps));
  tools.hackerNewsGetItem = withSummary(
    createHackerNewsGetItem(deps),
    summarizeFound,
  );
  tools.hackerNewsGetUser = withSummary(createHackerNewsGetUser(deps));
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
  const { serper, brave, searxng: searxngCfg, browserBase: bbCfg } = cfg;

  const hasAnySearch = Boolean(
    (serper.enabled && serper.apiKey && serper.web.enabled) ||
    (brave.enabled && brave.apiKey && brave.web.enabled) ||
    (searxngCfg.enabled && searxngCfg.url),
  );

  addCombinedWebSearch(tools, deps, hasAnySearch);
  addSerperTools(tools, deps, serper.enabled, cfg);
  addBraveTools(tools, deps, brave.enabled, cfg);
  addSearxngTool(tools, deps, searxngCfg.enabled, searxngCfg.url);
  addBrowserbaseTools(tools, deps, bbCfg.enabled, cfg);
  addWikipediaTools(tools, deps);
  addHackerNewsTools(tools, deps);
  addVariantTools(tools, enabledVariants ?? []);

  return tools;
}
