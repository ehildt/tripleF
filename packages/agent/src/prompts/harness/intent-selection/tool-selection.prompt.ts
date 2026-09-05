import { DEFAULT_MEDIA_COUNT, MORE_MEDIA_COUNT } from '../../../schemas/constants/media-counts.constant.js';

/**
 * The tools array may only carry exact names from the AVAILABLE TOOLS
 * catalog — never category names, never disabled tools.
 */
export const TOOL_NAME_RULES = `TOOL NAME RULES
- The tools array MUST contain only exact tool names listed in the AVAILABLE TOOLS catalog above.
- Do NOT use category names such as webSearch, imageSearch, newsSearch, videoSearch, pageFetch, specialized, or imageVariants as tool names.
- If a category has no enabled concrete tools, omit that tool entirely.`;

/**
 * An explicit provider mention ("on YouTube") narrows the media-type "every
 * enabled tool" rules to just that provider's tools.
 */
export const EXPLICIT_PROVIDER_RULES = `EXPLICIT PROVIDER MENTIONS (override the "every enabled *XSearch tool" rules in this prompt)
- If the user explicitly names a search engine, provider, or platform by name (e.g. "on YouTube", "via Serper", "search Bright Data"), include ONLY that provider's matching tool(s) — never every tool of that type.
- The mention must be explicit: "videos of X" still means every enabled *VideoSearch tool; "YouTube videos of X" means youtubeVideoSearch only.
- If the named provider's tool is not in the enabled catalog, fall back to the enabled equivalent of that type.`;

/**
 * Tool selection as multi-set composition: each tool is judged independently,
 * included when it meaningfully improves the answer.
 */
export const TOOL_SELECTION_MODEL = `TOOL SELECTION MODEL
Tool selection is MULTI-SET COMPOSITION.
Rules:
- You may select zero one or multiple tools
- Each tool is independent
- Include tool if required for any subtask
- A tool is required when the task would be MEANINGFULLY IMPROVED by it
- A tool is NOT only required when the task is literally impossible without it
- No preference for fewer or more tools
- No penalty for multiple tools

Evaluation:
- Evaluate each tool independently
- Include if it adds meaningful value
- Exclude only if it provides zero benefit
- No ranking
- No speculation`;

export const WHEN_TO_USE_TOOLS_RULES = `WHEN TO USE TOOLS
- external data (web files urls images) → the enabled *WebSearch tool
- specialized processing (ocr etc) → specialized tools
- explicit user request for external processing
- article template: the enabled *WebSearch tool is REQUIRED by default for factual research
- user asks about CURRENT EVENTS, RECENT RELEASES, products, games, software, movies, technology, news → the enabled *WebSearch tool
- user asks about a specific product to buy, prices, or best deals → product template with a *WebSearch tool, shopping search, and reviews search
- user asks about specific factual entities, specifications, data, statistics → the enabled *WebSearch tool`;

/**
 * Web-search selections pair with a fetch tool: the fetched full content
 * grounds the answer and populates the knowledge cache.
 */
export const FETCH_AFTER_SEARCH_RULES = `FETCH-AFTER-SEARCH RULES
- When you include a *WebSearch tool for factual research (article, news, evaluation, product, or text), also include a fetch tool — webFetch, serperWebpageScrape, or brightDataWebpageScrape — to fetch the most relevant result pages (typically 1-3; more when the topic is broad and several pages each add distinct depth).
- The fetched full content grounds the answer in source text (not just snippets) and populates the knowledge cache for future turns.
- You decide which pages are worth fetching: fetch only pages whose full content would meaningfully improve the answer. Skip fetching for trivial lookups, quick facts, or when the snippets already answer the request completely.
- Prefer primary/readable sources — official sites, documentation, Wikipedia, news articles — over app stores, forums, and discussion threads, unless the question is specifically about those.
- Prefer webFetch for plain pages; use a scrape tool for pages behind anti-bot protection.`;

/**
 * Media-type mentions map to concrete tool categories. Counts are governed
 * by the MEDIA COUNT RULES below.
 */
export const MEDIA_TYPE_TOOL_RULES = `MEDIA-TYPE TOOL SELECTION
When the user explicitly or implicitly requests specific media types, include the corresponding concrete tools (never category names):
- images, photos, pictures, screenshots, artwork → include every enabled *ImageSearch tool (e.g. serperImageSearch)
- news, latest, recent, current events → include every enabled *NewsSearch tool (e.g. serperNewsSearch)
- videos, trailers, clips, footage → include every enabled *VideoSearch tool (e.g. serperVideoSearch)
- webpages, articles, pages, documents → include every enabled *Fetch tool (e.g. serperWebpageScrape, webFetch)
- The same topic may require multiple media types: include ALL that apply.
- Example: "article about Gothic remake with images and videos" → serperWebSearch + serperImageSearch + serperVideoSearch.
- If the user says "with images and videos" and you omit the corresponding search tools, the response will fail to render the requested media. Include them.`;

export const PLACES_TOOL_RULES = `PLACES TOOL RULES
- Include serperPlacesSearch whenever the request involves LOCAL businesses, stores, restaurants, services, or venues: "near me", "in <city>", addresses, phone numbers, opening information, or local recommendations (e.g. "best coffee shops in Berlin", "a plumber in Munich").
- article: include serperPlacesSearch when the topic is a local guide or local business roundup (e.g. "best ramen spots in Tokyo") — places provide names, addresses, and ratings.
- evaluation: include serperPlacesSearch when the subject is a local business or venue — its rating and review count feed the verdict.
- text: include serperPlacesSearch for direct local lookups ("find a dentist near me", "phone number of ...").
- describe/compare: include serperPlacesSearch when the image shows an identifiable storefront, venue, or business clue the user asks to locate or identify.
- Do NOT include serperPlacesSearch for online-only shopping, editorial product research, news, media-list requests — or product/shoplist queries (no output field consumes places data there).`;

/**
 * imageCount/videoCount are only set for explicit asks or an unquantified
 * "more" — otherwise the pipeline's configured default applies. The numbers
 * interpolate the shared media-count constants so they cannot drift from the
 * pipeline's actual defaults.
 */
export const MEDIA_COUNT_RULES = `MEDIA COUNT RULES
- Include imageCount or videoCount ONLY in two cases:
  → The user explicitly asks for a specific number (e.g. "show me 7 images", "5 photos", "3 videos") — use that number.
  → The user asks for "more images" or "more videos" WITHOUT a number — use ${MORE_MEDIA_COUNT}.
- In every other case omit the field; the system applies its configured default of ${DEFAULT_MEDIA_COUNT}.
- Never return 0 or negative counts.
- These counts only matter when an *ImageSearch or *VideoSearch tool is selected.`;

export const RECENCY_RULES = `RECENCY RULES (getDate)
- The pipeline automatically anchors search queries on the current date and the search tools can filter results to recent periods. getDate controls this behavior.
- Keep the default true whenever freshness matters: news, current events, latest releases, announcements, prices, versions, sports, ongoing development, recommendations ("best X"), or media lookups about a living topic.
- Set false ONLY for timeless requests where a date anchor would pollute the search query: historical events, scientific concepts, math, coding concepts, definitions, biographies, creative writing, personal opinions, nostalgia.
- When in doubt, keep the default true.`;

/**
 * The closing pointers of the classifier body. The final "return only valid
 * JSON" reminder lives in the appended structured-output schema section
 * (buildStructuredJsonPrompt) — the body deliberately ends on the tool
 * determinism note instead of repeating it.
 */
export const OUTPUT_FORMAT_POINTER = `OUTPUT FORMAT
Return ONLY valid JSON matching the schema described in the separate OUTPUT FORMAT instruction.
No markdown code fences, no explanations.`;

export const TOOL_DETERMINISM_RULES = `TOOL DETERMINISM
A tool is included iff the task would be MEANINGFULLY IMPROVED by it.
When in doubt for article template, INCLUDE a *WebSearch tool.
When in doubt for product template, INCLUDE serperShoppingSearch (if enabled) along with a *WebSearch tool.
When in doubt about media type requests, INCLUDE the corresponding search tools.`;
