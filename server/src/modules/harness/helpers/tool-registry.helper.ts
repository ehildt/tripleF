/**
 * Tool vocabulary, descriptions, and enabled-tool resolution for harness
 * intent classification.
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
    'Combined web search across all enabled engines. Returns titles, snippets, and URLs. Use for general research and fact-finding.',
  searxngSearch:
    'Search the web via a self-hosted SearXNG instance. Returns ranked results with titles, snippets, and URLs.',
  serperWebSearch:
    'Search the web using Serper.dev (Google). Returns organic results with titles, snippets, and links.',
  serperImageSearch:
    'Search for images using Serper.dev (Google Images). Prefers 2560×1440 (1440p) images and enforces a minimum of 1280×720 (720p) via the Google Images tbs size filter and a client-side dimension filter.',
  serperNewsSearch:
    'Search latest news using Serper.dev. Returns headlines, sources, dates, and snippets.',
  serperPlacesSearch:
    'Search places and businesses using Serper.dev. Returns addresses, phone numbers, ratings, and coordinates.',
  serperShoppingSearch:
    'Search for products using Serper.dev. Returns prices, sources, images, and ratings.',
  serperReviewsSearch:
    'Search for reviews using Serper.dev. Returns ratings, snippets, sources, and dates.',
  serperVideoSearch:
    'Search for videos using Serper.dev. Returns titles, links, channel names, duration, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
  serperWebpageFetch:
    'Fetch and render a full webpage using Serper.dev scrape API. Returns clean rendered text with its title.',
  braveWebSearch:
    'Search the web using Brave Search API. Returns organic results with titles, descriptions, and URLs.',
  braveImageSearch:
    'Search for images using Brave Image Search. Prefers 2560×1440 (1440p) images and enforces a minimum of 1280×720 (720p) via client-side dimension filtering because the Brave API has no server-side size filter.',
  braveNewsSearch:
    'Search latest news using Brave Search API. Returns headlines, sources, dates, and snippets.',
  braveVideoSearch:
    'Search for videos using Brave Search API. Returns titles, links, descriptions, and publish dates. Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
  browserbaseSearch:
    'Search the web using Browserbase Search API. Returns ranked URLs with titles, author, and publication dates. Results do NOT include text snippets or descriptions. Use only for URL discovery.',
  browserbaseFetch:
    'Scrape a webpage using Browserbase cloud browser. Renders JavaScript, handles bot protection. Use for protected or JS-heavy pages.',
  browserbaseWebpageFetch:
    'Fetch and render a full webpage using Browserbase cloud browser. Returns clean rendered text with its title. Use when a URL needs JS rendering or bot-protection.',
  webFetch:
    'Fetch the full content of a specific URL. Use only when search snippets are insufficient.',
  wikipediaSearch:
    'Search Wikipedia for articles matching the query. Returns titles, descriptions, and page links.',
  wikipediaGetPage:
    'Get the full text content of a Wikipedia page by title. Returns the page title and its text content.',
  hackerNewsSearch:
    'Search Hacker News stories, comments, and jobs using Algolia. Returns titles, URLs, points, and authors.',
  hackerNewsGetItem:
    'Get a specific Hacker News item (story or comment) by its ID using the Firebase API. Returns full item data.',
  hackerNewsGetUser:
    'Get a Hacker News user profile by username using the Firebase API. Returns karma, creation date, and about text.',
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
  'wikipediaSearch',
  'wikipediaGetPage',
  'hackerNewsSearch',
  'hackerNewsGetItem',
  'hackerNewsGetUser',
  'serperWebSearch',
  'serperImageSearch',
  'serperNewsSearch',
  'serperPlacesSearch',
  'serperShoppingSearch',
  'serperReviewsSearch',
  'serperVideoSearch',
  'serperWebpageFetch',
  'braveWebSearch',
  'braveImageSearch',
  'braveNewsSearch',
  'braveVideoSearch',
  'searxngSearch',
  'browserbaseSearch',
  'browserbaseFetch',
  'browserbaseWebpageFetch',
  'requestGrayscale',
  'requestDenoised',
  'requestSharpened',
  'requestClahe',
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

/** Category names the classifier prompt uses as shorthand; not real tools. */
export const TOOL_CATEGORY_ALIASES = [
  'webSearch',
  'imageSearch',
  'newsSearch',
  'videoSearch',
  'webpageFetch',
  'imageVariants',
  'specialized',
] as const;

export type ToolCategoryAlias = (typeof TOOL_CATEGORY_ALIASES)[number];

/** Categorize tool names into functional groups for classifier prompts. */
export function categorizeTools(
  toolNames: readonly string[],
): Record<string, string[]> {
  const cats: Record<string, string[]> = {
    webSearch: [],
    imageSearch: [],
    newsSearch: [],
    videoSearch: [],
    webpageFetch: [],
    imageVariants: [],
    specialized: [],
  };
  for (const t of toolNames) {
    if (t === 'webSearch' || t === 'searxngSearch' || t.endsWith('WebSearch'))
      cats.webSearch.push(t);
    else if (t.endsWith('ImageSearch')) cats.imageSearch.push(t);
    else if (t.endsWith('NewsSearch')) cats.newsSearch.push(t);
    else if (t.endsWith('VideoSearch')) cats.videoSearch.push(t);
    else if (t.includes('Fetch') || t.includes('fetch') || t === 'webFetch')
      cats.webpageFetch.push(t);
    else if (t.startsWith('request')) cats.imageVariants.push(t);
    else cats.specialized.push(t);
  }
  return cats;
}

/**
 * Expand category aliases (e.g. "imageSearch") returned by the intent
 * classifier into the concrete enabled tool names. Valid concrete tool names
 * are kept as-is. Unknown names are dropped.
 */
export function expandToolAliases(
  rawTools: readonly string[],
  enabledToolNames: readonly string[],
): string[] {
  const enabledSet = new Set(enabledToolNames);
  const categories = categorizeTools(enabledToolNames);
  const expanded = new Set<string>();

  for (const tool of rawTools) {
    if (enabledSet.has(tool)) {
      expanded.add(tool);
      continue;
    }

    const categoryTools = categories[tool];
    if (categoryTools) {
      for (const concrete of categoryTools) {
        expanded.add(concrete);
      }
    }
  }

  return [...expanded];
}

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
    webpageFetch: { enabled: boolean };
  };
  brave: {
    enabled: boolean;
    apiKey?: string;
    web: { enabled: boolean };
    images: { enabled: boolean };
    news: { enabled: boolean };
    video: { enabled: boolean };
  };
  searxng: { enabled: boolean; url?: string };
  browserBase: {
    enabled: boolean;
    apiKey?: string;
    search: { enabled: boolean };
    fetch: { enabled: boolean };
  };
};

/** Return only the tool names whose search engines are currently enabled. */
export function getEnabledToolNames(cfg: ProviderConfig): string[] {
  const enabled: string[] = [];

  enabled.push('webFetch');

  const hasAnySearch =
    (cfg.serper.enabled && cfg.serper.apiKey && cfg.serper.web.enabled) ||
    (cfg.brave.enabled && cfg.brave.apiKey && cfg.brave.web.enabled) ||
    (cfg.searxng.enabled && cfg.searxng.url);
  if (hasAnySearch) {
    enabled.push('webSearch');
  }

  addSerperTools(cfg.serper, enabled);
  addBraveTools(cfg.brave, enabled);
  addSearxngTool(cfg.searxng, enabled);
  addBrowserBaseTools(cfg.browserBase, enabled);

  // Always available
  enabled.push(
    'wikipediaSearch',
    'wikipediaGetPage',
    'hackerNewsSearch',
    'hackerNewsGetItem',
    'hackerNewsGetUser',
  );

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
  if (serper.reviews.enabled) enabled.push('serperReviewsSearch');
  if (serper.videos.enabled) enabled.push('serperVideoSearch');
  if (serper.webpageFetch.enabled) enabled.push('serperWebpageFetch');
}

function addBraveTools(
  brave: ProviderConfig['brave'],
  enabled: string[],
): void {
  if (!brave.enabled || !brave.apiKey) return;
  if (brave.web.enabled) enabled.push('braveWebSearch');
  if (brave.images.enabled) enabled.push('braveImageSearch');
  if (brave.news.enabled) enabled.push('braveNewsSearch');
  if (brave.video.enabled) enabled.push('braveVideoSearch');
}

function addSearxngTool(
  searxng: ProviderConfig['searxng'],
  enabled: string[],
): void {
  if (searxng.enabled && searxng.url) {
    enabled.push('searxngSearch');
  }
}

function addBrowserBaseTools(
  browserBase: ProviderConfig['browserBase'],
  enabled: string[],
): void {
  if (!browserBase.enabled || !browserBase.apiKey) return;
  if (browserBase.search.enabled) enabled.push('browserbaseSearch');
  if (browserBase.fetch.enabled) {
    enabled.push('browserbaseFetch');
    enabled.push('browserbaseWebpageFetch');
  }
}
