import type { ProviderConfig } from '@triplef/agent/schemas';
import { BROWSER_TOOL_NAMES, MEMORY_TOOL_NAMES } from '@triplef/agent/schemas';

/**
 * Return only the tool names whose search engines are currently enabled.
 * Memory tools join the classifier vocabulary when the memory feature is
 * enabled — they are gated by QDRANT_CONFIG, not the provider overrides.
 */
export function getEnabledToolNames(
  cfg: ProviderConfig,
  memoryEnabled = false,
): string[] {
  const enabled: string[] = [];

  enabled.push('webFetch');

  addBrightDataTools(cfg.brightData, enabled);
  addSerperTools(cfg.serper, enabled);
  addEodhdTools(cfg.eodhd, enabled);
  addYoutubeTools(cfg.youtube, enabled);
  if (cfg.playwright.enabled) enabled.push(...BROWSER_TOOL_NAMES);
  if (memoryEnabled) enabled.push(...MEMORY_TOOL_NAMES);

  return enabled;
}

function addBrightDataTools(
  brightData: ProviderConfig['brightData'],
  enabled: string[],
): void {
  if (!brightData.enabled || !brightData.apiKey) return;
  if (brightData.web.enabled) enabled.push('brightDataWebSearch');
  if (brightData.images.enabled) enabled.push('brightDataImageSearch');
  if (brightData.news.enabled) enabled.push('brightDataNewsSearch');
  if (brightData.places.enabled) enabled.push('brightDataPlacesSearch');
  if (brightData.shopping.enabled) enabled.push('brightDataShoppingSearch');
  if (brightData.videos.enabled) enabled.push('brightDataVideoSearch');
  if (brightData.scrape.enabled) enabled.push('brightDataWebpageScrape');
}

function addSerperTools(
  serper: ProviderConfig['serper'],
  enabled: string[],
): void {
  if (!serper.enabled || !serper.apiKey) return;
  if (serper.web.enabled) enabled.push('serperWebSearch');
  if (serper.images.enabled) enabled.push('serperImageSearch');
  if (serper.news.enabled) enabled.push('serperNewsSearch');
  if (serper.places.enabled) enabled.push('serperPlacesSearch');
  if (serper.shopping.enabled) enabled.push('serperShoppingSearch');
  if (serper.reviews.enabled) enabled.push('serperBusinessReviewsSearch');
  if (serper.videos.enabled) enabled.push('serperVideoSearch');
  if (serper.scrape.enabled) enabled.push('serperWebpageScrape');
}

function addEodhdTools(
  eodhd: ProviderConfig['eodhd'] | undefined,
  enabled: string[],
): void {
  if (!eodhd?.enabled || !eodhd?.apiKey) return;
  if (eodhd.search.enabled) enabled.push('eodhdSearch');
  if (eodhd.quote.enabled) enabled.push('eodhdQuote');
  if (eodhd.history.enabled) enabled.push('eodhdHistory');
  if (eodhd.technical.enabled) enabled.push('eodhdTechnical');
  if (eodhd.intraday.enabled) enabled.push('eodhdIntraday');
  if (eodhd.news.enabled) enabled.push('eodhdNews');
  if (eodhd.fundamentals.enabled) enabled.push('eodhdFundamentals');
}

function addYoutubeTools(
  youtube: ProviderConfig['youtube'],
  enabled: string[],
): void {
  if (!youtube.enabled || !youtube.apiKey) return;
  if (youtube.videos.enabled) enabled.push('youtubeVideoSearch');
}
