import type { ProviderConfig } from './tool-registry.constants.js';

/** Return only the tool names whose search engines are currently enabled. */
export function getEnabledToolNames(cfg: ProviderConfig): string[] {
  const enabled: string[] = [];

  enabled.push('webFetch');

  const hasWebSearch =
    cfg.serper.enabled && cfg.serper.apiKey && cfg.serper.web.enabled;
  if (hasWebSearch) {
    enabled.push('webSearch');
  }

  addSerperTools(cfg.serper, enabled);
  addYoutubeTools(cfg.youtube, enabled);

  return enabled;
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
