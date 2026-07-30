import type { ToolSet } from 'ai';

import { createVariantRequestTool } from './image-variants.tool.js';
import {
  createSerperBusinessReviewsSearch,
  createSerperImageSearch,
  createSerperNewsSearch,
  createSerperPlacesSearch,
  createSerperShoppingSearch,
  createSerperVideoSearch,
  createSerperWebpageScrape,
  createSerperWebSearch,
} from './serper.js';
import { withSummary } from './tool-factory.js';
import type { ToolDependencies } from './types.js';
import { createWebFetchTool } from './web-fetch.tool.js';
import { createWebSearch } from './web-search.tool.js';

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
  const { serper } = cfg;

  const hasWebSearch = Boolean(
    serper.enabled && serper.apiKey && serper.web.enabled,
  );

  if (hasWebSearch) tools.webSearch = withSummary(createWebSearch(deps));

  addSerperTools(tools, deps, serper.enabled, cfg);
  addVariantTools(tools, enabledVariants ?? []);

  return tools;
}
