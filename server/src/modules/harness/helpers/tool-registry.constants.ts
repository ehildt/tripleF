/**
 * Tool vocabulary, descriptions, and types for harness intent classification.
 */

export const VARIANT_NAMES = [
  'grayscale',
  'denoised',
  'sharpened',
  'clahe',
] as const;

export type VariantName = (typeof VARIANT_NAMES)[number];

export const TOOL_DESCRIPTIONS: Record<string, string> = {
  webSearch:
    'Web search. Returns titles, snippets, and URLs. Use for general research and fact-finding. Supports an optional recency window (day/week/month/year) for fresh results.',
  serperWebSearch:
    'Search the web using Serper.dev (Google). Returns organic results with titles, snippets, and links. Supports an optional recency window (day/week/month/year) for fresh results.',
  serperImageSearch:
    'Search for images using Serper.dev (Google Images). Prefers 2560×1440 (1440p) images and enforces a minimum of 1280×720 (720p) via the Google Images tbs size filter and a client-side dimension filter. Supports an optional recency window (day/week/month/year).',
  serperNewsSearch:
    'Search latest news using Serper.dev. Returns headlines, sources, dates, and snippets. Supports an optional recency window (day/week/month/year).',
  serperPlacesSearch:
    'Search places and businesses using Serper.dev (Google Maps). Returns addresses, phone numbers, ratings, review counts, and coordinates. Query with a business name or business type plus location.',
  serperShoppingSearch:
    'Search for products using Serper.dev (Google Shopping). Returns prices, sellers, delivery info, images, and per-offer ratings. Query with the bare product name and model number.',
  serperBusinessReviewsSearch:
    'Fetch Google Maps reviews for a specific business or place using Serper.dev. Returns reviewer snippets with author names, star ratings, and dates. Use for seller/business reputation, not editorial product reviews.',
  serperVideoSearch:
    'Search for videos using Serper.dev. Returns titles, links, channel names, duration, and publish dates. Supports an optional recency window (day/week/month/year). Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
  serperWebpageScrape:
    'Fetch and render a full webpage using Serper.dev scrape API. Returns clean rendered text with its title.',
  youtubeVideoSearch:
    'Search YouTube using the official YouTube Data API. Returns titles, links, channel names, durations, view counts, upload dates, and direct thumbnails. All results are embeddable YouTube videos.',
  webFetch:
    'Fetch the full content of a specific URL. Use only when search snippets are insufficient.',
  requestGrayscale:
    'Request a grayscale version of the images. Use when color noise or color information is irrelevant, for example when reading text or analyzing shapes.',
  requestDenoised:
    'Request a denoised (blurred) version of the images. Use when the original has noise, grain, or artifacts that hide details.',
  requestSharpened:
    'Request a sharpened version of the images. Use when edges or fine details are blurry.',
  requestClahe:
    'Request a CLAHE (contrast-enhanced) version of the images. Use when details are hidden in shadows or highlights.',
};

export const TOOL_NAMES = [
  'webSearch',
  'webFetch',
  'serperWebSearch',
  'serperImageSearch',
  'serperNewsSearch',
  'serperPlacesSearch',
  'serperShoppingSearch',
  'serperBusinessReviewsSearch',
  'serperVideoSearch',
  'serperWebpageScrape',
  'youtubeVideoSearch',
  'requestGrayscale',
  'requestDenoised',
  'requestSharpened',
  'requestClahe',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export type ProviderConfig = {
  serper: {
    enabled: boolean;
    apiKey?: string;
    web: { enabled: boolean };
    images: { enabled: boolean };
    news: { enabled: boolean };
    places: { enabled: boolean };
    shopping: { enabled: boolean };
    reviews: { enabled: boolean };
    videos: { enabled: boolean };
    scrape: { enabled: boolean };
  };
  youtube: {
    enabled: boolean;
    apiKey?: string;
    videos: { enabled: boolean };
  };
};
