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
  brightDataWebSearch:
    'Search the web using Bright Data SERP API (Google). Returns organic results with titles, snippets, and links. Supports an optional recency window (day/week/month/year) for fresh results.',
  brightDataImageSearch:
    'Search for images using Bright Data SERP API (Google Images). Returns image URLs, source pages, and dimensions. Enforces a minimum of 1280×720 (720p).',
  brightDataNewsSearch:
    'Search latest news using Bright Data SERP API. Returns headlines, sources, dates, and snippets. Supports an optional recency window (day/week/month/year).',
  brightDataPlacesSearch:
    'Search places and businesses using Bright Data SERP API (Google Maps). Returns addresses, phone numbers, ratings, review counts, and coordinates. Query with a business name or business type plus location.',
  brightDataShoppingSearch:
    'Search for products using Bright Data SERP API (Google Shopping). Returns prices, sellers, images, and ratings. Query with the bare product name and model number.',
  brightDataVideoSearch:
    'Search for videos using Bright Data SERP API. Returns titles, links, channel names, duration, and publish dates. Supports an optional recency window (day/week/month/year). Only return URLs from supported embeddable providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other unreliable platforms.',
  brightDataWebpageScrape:
    'Fetch and render a full webpage using Bright Data Web Unlocker API. Returns clean Markdown text. Use for pages behind anti-bot protection that plain fetch cannot reach.',
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
  browser_navigate:
    'Control a real browser: navigate to a URL. Use for interactive browsing — JS-heavy pages, content behind clicks, tabs, scrolling, or forms — that static search/fetch cannot reach. Follow up with browser_snapshot to read the page before acting on it.',
  browser_navigate_back: 'Go back to the previous page in the browser history.',
  browser_snapshot:
    'Read the current browser page as an accessibility snapshot (structured text with element refs). The primary way to see page content and obtain the refs that browser_click/browser_type need.',
  browser_click:
    'Click an element in the browser, referenced by a ref from browser_snapshot.',
  browser_type:
    'Type text into an editable browser element, referenced by a ref from browser_snapshot, optionally submitting with Enter.',
  browser_fill_form: 'Fill multiple form fields in the browser in one call.',
  browser_select_option: 'Select an option in a dropdown in the browser.',
  browser_press_key:
    'Press a keyboard key in the browser (Enter, Tab, arrows).',
  browser_wait_for:
    'Wait for text to appear or disappear, or for a time period, in the browser.',
  browser_take_screenshot:
    'Take a screenshot of the current browser page or a specific element.',
  browser_tabs: 'List, create, close, or switch browser tabs.',
  browser_console_messages:
    'Get console messages from the browser. Use to diagnose JavaScript errors on a page (e.g. when testing a web app).',
  browser_network_requests:
    'List network requests the browser made since page load. Use to diagnose failed or slow requests (e.g. when testing a web app).',
  browser_verify_element_visible:
    'Assert that an element is visible on the current browser page.',
  browser_verify_text_visible:
    'Assert that text is visible on the current browser page.',
  requestGrayscale:
    'Request a grayscale version of the images. Use when color noise or color information is irrelevant, for example when reading text or analyzing shapes.',
  requestDenoised:
    'Request a denoised (blurred) version of the images. Use when the original has noise, grain, or artifacts that hide details.',
  requestSharpened:
    'Request a sharpened version of the images. Use when edges or fine details are blurry.',
  requestClahe:
    'Request a CLAHE (contrast-enhanced) version of the images. Use when details are hidden in shadows or highlights.',
};

/**
 * Curated allow-list of Playwright MCP browser tools (client-side filter;
 * the sidecar may offer more — dangerous ones stay suppressed).
 */
export const BROWSER_TOOL_NAMES = [
  'browser_navigate',
  'browser_navigate_back',
  'browser_snapshot',
  'browser_click',
  'browser_type',
  'browser_fill_form',
  'browser_select_option',
  'browser_press_key',
  'browser_wait_for',
  'browser_take_screenshot',
  'browser_tabs',
  'browser_console_messages',
  'browser_network_requests',
  'browser_verify_element_visible',
  'browser_verify_text_visible',
] as const;

export const TOOL_NAMES = [
  'webSearch',
  'webFetch',
  'brightDataWebSearch',
  'brightDataImageSearch',
  'brightDataNewsSearch',
  'brightDataPlacesSearch',
  'brightDataShoppingSearch',
  'brightDataVideoSearch',
  'brightDataWebpageScrape',
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
  ...BROWSER_TOOL_NAMES,
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
  brightData: {
    enabled: boolean;
    apiKey?: string;
    web: { enabled: boolean };
    images: { enabled: boolean };
    news: { enabled: boolean };
    places: { enabled: boolean };
    shopping: { enabled: boolean };
    videos: { enabled: boolean };
    scrape: { enabled: boolean };
  };
  playwright: {
    enabled: boolean;
  };
};
