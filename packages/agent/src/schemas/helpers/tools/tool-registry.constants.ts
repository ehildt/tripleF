/**
 * Tool vocabulary, descriptions, and types for harness intent classification.
 */

export const VARIANT_NAMES = ['grayscale', 'denoised', 'sharpened', 'clahe'] as const;

export type VariantName = (typeof VARIANT_NAMES)[number];

export const TOOL_DESCRIPTIONS: Record<string, string> = {
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
  eodhdSearch:
    'Resolve a company, ETF, or index name to an EODHD ticker code (e.g. "Nvidia" → NVDA.US). Use before fetching quotes, history, technicals, or news for a named entity.',
  eodhdQuote:
    'Fetch the current (delayed) quote for one or more EODHD tickers — last price, change, change %, open/high/low, volume, previous close.',
  eodhdHistory:
    'Fetch end-of-day OHLCV price history for an EODHD ticker. Returns a compact summary plus the full time series as chartData for the client chart. Use for the time-value chart and buy/sell pressure (volume).',
  eodhdTechnical:
    'Fetch a technical indicator series (RSI, MACD, ADX, SMA, EMA, BBANDS, ATR, …) for an EODHD ticker. Use to gauge buy/sell pressure and momentum.',
  eodhdIntraday:
    'Fetch intraday OHLCV bars for an EODHD ticker and return a per-day, per-price-band volume profile as chartData for the client heatmap. Use to render a volume heatmap across fixed price bands.',
  eodhdNews:
    'Fetch recent financial news for an EODHD ticker — headlines, links, sources, publish dates. Use to ground a stock-market answer in what is happening around a company.',
  eodhdFundamentals:
    'Fetch company fundamentals for an EODHD ticker — general info, valuation, and key financial highlights (sector, market cap, P/E, revenue, margins).',
  webFetch:
    'Fetch the full content of a specific URL (e.g. a search result page) as clean Markdown. Prefer fetching the most relevant search results to ground the answer in full source text rather than relying on snippets alone.',
  browser_navigate:
    'Control a real browser: navigate to a URL. Use for interactive browsing — JS-heavy pages, content behind clicks, tabs, scrolling, or forms — that static search/fetch cannot reach. Follow up with browser_snapshot to read the page before acting on it.',
  browser_navigate_back: 'Go back to the previous page in the browser history.',
  browser_snapshot:
    'Read the current browser page as an accessibility snapshot (structured text with element refs). The primary way to see page content and obtain the refs that browser_click/browser_type need.',
  browser_click: 'Click an element in the browser, referenced by a ref from browser_snapshot.',
  browser_type:
    'Type text into an editable browser element, referenced by a ref from browser_snapshot, optionally submitting with Enter.',
  browser_fill_form: 'Fill multiple form fields in the browser in one call.',
  browser_select_option: 'Select an option in a dropdown in the browser.',
  browser_press_key: 'Press a keyboard key in the browser (Enter, Tab, arrows).',
  browser_wait_for: 'Wait for text to appear or disappear, or for a time period, in the browser.',
  browser_take_screenshot: 'Take a screenshot of the current browser page or a specific element.',
  browser_tabs: 'List, create, close, or switch browser tabs.',
  browser_console_messages:
    'Get console messages from the browser. Use to diagnose JavaScript errors on a page (e.g. when testing a web app).',
  browser_network_requests:
    'List network requests the browser made since page load. Use to diagnose failed or slow requests (e.g. when testing a web app).',
  browser_verify_element_visible: 'Assert that an element is visible on the current browser page.',
  browser_verify_text_visible: 'Assert that text is visible on the current browser page.',
  requestGrayscale:
    'Request a grayscale version of the images. Use when color noise or color information is irrelevant, for example when reading text or analyzing shapes.',
  requestDenoised:
    'Request a denoised (blurred) version of the images. Use when the original has noise, grain, or artifacts that hide details.',
  requestSharpened: 'Request a sharpened version of the images. Use when edges or fine details are blurry.',
  requestClahe:
    'Request a CLAHE (contrast-enhanced) version of the images. Use when details are hidden in shadows or highlights.',
  'memory-partition-remember':
    'Store into the user\'s fact partition (memory-partition): notable facts about subjects they care about (favorites, interests, projects, followed stocks, people, past topics), preferences and durable details they state, and anything they explicitly ask you to remember. Storing gathered knowledge and noticed preferences is expected — do not wait for an explicit "remember" instruction.',
  'memory-partition-recall':
    "Retrieve from the user's fact partition (memory-partition) — things they told you in past conversations or asked you to remember. These are trusted user statements, not public facts; attribute them to the user and prefer them over web results for anything personal. Check this tool whenever a request touches a subject this user has cared about before.",
  'memory-partition-delete':
    "Delete one exact fact record from the user's fact partition (memory-partition), quoted verbatim from a memory-partition-recall result. Never delete on a guess: recall first, delete the verbatim statement. Needs memory-partition-recall alongside it.",
  'memory-cognition-remember':
    'Store one derived insight into your cognition space (memory-cognition) — your own understanding of the user (inferred traits, standing interests, working nuances, connections between facts). Use for what you LEARN about the user, not what they stated; stated facts belong in memory-partition-remember.',
  'memory-cognition-forget':
    'Wipe your entire cognition space (memory-cognition) of the user — the structured profile AND every derived insight — only when the user asks you to forget your learned understanding of them or to start over. Fact records in the partition are untouched.',
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

export const MEMORY_TOOL_NAMES = [
  'memory-partition-remember',
  'memory-partition-recall',
  'memory-partition-delete',
  'memory-cognition-remember',
  'memory-cognition-forget',
] as const;

export const TOOL_NAMES = [
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
  'eodhdSearch',
  'eodhdQuote',
  'eodhdHistory',
  'eodhdTechnical',
  'eodhdIntraday',
  'eodhdNews',
  'eodhdFundamentals',
  'requestGrayscale',
  'requestDenoised',
  'requestSharpened',
  'requestClahe',
  'memory-partition-remember',
  'memory-partition-recall',
  'memory-partition-delete',
  'memory-cognition-remember',
  'memory-cognition-forget',
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
  eodhd: {
    enabled: boolean;
    apiKey?: string;
    search: { enabled: boolean };
    quote: { enabled: boolean };
    history: { enabled: boolean };
    technical: { enabled: boolean };
    intraday: { enabled: boolean };
    news: { enabled: boolean };
    fundamentals: { enabled: boolean };
  };
  playwright: {
    enabled: boolean;
  };
};
