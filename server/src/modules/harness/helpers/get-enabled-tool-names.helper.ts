import type { ProviderConfig } from './tool-registry.constants.js';
import { BROWSER_TOOL_NAMES } from './tool-registry.constants.js';

/** Return only the tool names whose search engines are currently enabled. */
export function getEnabledToolNames(cfg: ProviderConfig): string[] {
  const enabled: string[] = [];

  enabled.push('webFetch');

  const hasWebSearch =
    (cfg.serper.enabled && cfg.serper.apiKey && cfg.serper.web.enabled) ||
    (cfg.brightData.enabled &&
      cfg.brightData.apiKey &&
      cfg.brightData.web.enabled);
  if (hasWebSearch) {
    enabled.push('webSearch');
  }

  addBrightDataTools(cfg.brightData, enabled);
  addSerperTools(cfg.serper, enabled);
  addYoutubeTools(cfg.youtube, enabled);
  if (cfg.playwright.enabled) enabled.push(...BROWSER_TOOL_NAMES);

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

function addYoutubeTools(
  youtube: ProviderConfig['youtube'],
  enabled: string[],
): void {
  if (!youtube.enabled || !youtube.apiKey) return;
  if (youtube.videos.enabled) enabled.push('youtubeVideoSearch');
}
