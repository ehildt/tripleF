/**
 * The detailed per-template selection sections: when each template applies
 * and which tool families it carries. The per-template entries in TEMPLATE
 * RULES point here instead of repeating these lists.
 */
export const PRODUCT_TEMPLATE_RULES = `PRODUCT TEMPLATE RULES
- If the user asks about a specific product they want to purchase (e.g. 'iPhone 16 Pro Max', 'Sony WH-1000XM5', 'best budget mechanical keyboard'), you MUST choose template 'product'.
- Choose 'product' when the user asks for prices, shopping options, deals, or where to buy something specific.
- For template 'product': include the enabled *WebSearch tool and every enabled *ImageSearch and *VideoSearch tool (same media behavior as article).
- When serperShoppingSearch is available, include it for all product queries.
- The 'product' template produces a structured product overview with hero media, key specs, shop offers with prices, and review highlights.
- Distinguish: product launch news/announcements → "news". Specific product with purchase intent → "product". In-depth product research/history → "article".`;

export const SHOPLIST_TEMPLATE_RULES = `SHOPLIST TEMPLATE RULES
- Choose 'shoplist' when the user keeps asking about the SAME product that already received a full 'product' overview earlier in the conversation: follow-up questions about prices, other shops, availability, or where to buy it.
- DETECTION: assistant turns in the history carry a '[Template: <name>]' marker naming the template that produced each prior answer. A prior '[Template: product]' answer about the same product + a new shopping/purchase follow-up → 'shoplist' — even when the latest message reads like a fresh product query.
- The first purchase question about a product is 'product' (full card). Repeated purchase questions about that same product are 'shoplist' (compact list). A question about a DIFFERENT product is 'product' again.
- For template 'shoplist': include the enabled *WebSearch tool, every enabled *ImageSearch tool (the list items show a product image), and serperShoppingSearch when available. Do NOT include *VideoSearch or serperBusinessReviewsSearch — the compact list renders no videos and no seller reviews.
- The 'shoplist' template produces a compact product/shop list: product title, optional one-line context, and shop offers with direct store links. No specs, pros/cons, galleries, or videos.`;

export const IMAGELIST_TEMPLATE_RULES = `IMAGELIST TEMPLATE RULES
- Choose "imagelist" when the user explicitly wants ONLY images: a collection, gallery, or set of pictures about a topic (e.g. "show me pictures of X", "find images of Y", "wallpapers of Z", "photos of ...").
- The user wants the images themselves, NOT an article illustrated with images. If the user asks for information/research/news WITH images, choose article or news instead.
- Informational requests are NEVER imagelist, even when visuals would help: recipes, instructions, tutorials, "how to", guides, workouts, itineraries, or gift ideas want STEPS and CONTENT, not a bare gallery. Choose "article" (or "text") and include the image tools — the response still renders images in hero and gallery sections.
- Counter-example: "finde mir Rezepte für Schoko-Kekse" → "article" with a *WebSearch tool + image tools (recipe content with photos), NOT "imagelist".
- For template "imagelist": include every enabled *ImageSearch tool (e.g. serperImageSearch) — or ONLY the named provider's tool when the user explicitly named one. Do NOT include *VideoSearch or *NewsSearch tools.
- Include the enabled *WebSearch tool only when the topic needs factual context to find the right images (e.g. a specific event, person, or product version).
- Follow-ups asking for MORE images (e.g. "more images", "weitere bilder", "next") about an established topic are still "imagelist" — the pipeline excludes all imageUrls from earlier imagelist responses, so only fresh images are returned.`;

export const VIDEOLIST_TEMPLATE_RULES = `VIDEOLIST TEMPLATE RULES
- Choose "videolist" when the user explicitly wants ONLY videos: a list or playlist of videos about a topic (e.g. "find music videos of Daft Punk on YouTube", "show me trailers for X", "playlist of workout videos", "clips of ...").
- Music videos, trailers, and clip collections are videolist requests — NEVER choose "news" for them, even when the user mentions a platform like YouTube or says "latest music videos".
- For template "videolist": include every enabled *VideoSearch tool (e.g. serperVideoSearch) — or ONLY the named platform's tool when the user explicitly named one. Do NOT include *ImageSearch or *NewsSearch tools.
- Include the enabled *WebSearch tool only when the topic needs factual context to find the right videos.
- When the user names a platform (e.g. YouTube), keep template "videolist" and include ONLY that platform's video tool (e.g. youtubeVideoSearch).
- Follow-ups asking for MORE videos (e.g. "more videos", "weitere videos", "next") about an established topic are still "videolist" — the response model will exclude all videoUrls from earlier videolist responses, so only fresh videos are returned.`;

export const NEWS_TEMPLATE_RULES = `NEWS TEMPLATE RULES
- If the user asks for "news", "latest", "recent", "breaking", "announcements", "update", "status", or "current events", you MUST choose template "news". Never choose "article" for these requests.
- Prefer "news" over "article" for short, time-sensitive queries about ongoing or just-announced events, product launches, or status updates.
- For template "news": include the enabled *WebSearch tool and every enabled *NewsSearch tool (e.g. serperNewsSearch).
- For template "news": include *ImageSearch and *VideoSearch tools when the user asks for images/videos or the topic is likely visual.
- The "news" template produces a compact news brief composed from snippets: headline, deck, lead, key points, at most 1-2 short context paragraphs, sources, dateline, byline, and optional related stories. It is brief by design — in-depth coverage belongs to "article".`;

export const STOCKMARKET_TEMPLATE_RULES = `STOCK MARKET TEMPLATE RULES
- Choose "stockmarketitem" when the user asks about a SINGLE stock, ETF, or index (e.g. "Nvidia stock", "how is AMD doing", "the price of the MSCI World"). It renders a quote with a price chart, buy/sell pressure, a recommendation, and recent news.
- Choose "stockmarketlist" when the user asks for a SELECTION of stocks/indices or a generic market overview (e.g. "show me Nvidia, AMD, and the MSCI World", "how are the markets doing", "tech stocks overview"). It renders a list of instruments with a market overview.
- For "stockmarketitem": include eodhdSearch (to resolve the name to a ticker), eodhdQuote, eodhdHistory, eodhdTechnical, eodhdNews, and eodhdFundamentals when available, plus eodhdIntraday for the volume-heatmap feed. The chart data is streamed to the client separately — the model writes the narrative and recommendation. Also include the enabled *WebSearch tool for general web context and recent developments beyond the market feeds, and every enabled *VideoSearch tool so the card can render analyst/explainer videos.
- For "stockmarketlist": include eodhdSearch and eodhdQuote for each requested instrument, plus eodhdHistory for the overview chart when the user wants a market view. Also include the enabled *WebSearch tool for market context and every enabled *VideoSearch tool when the topic has likely video coverage. Do NOT hardcode a watchlist — resolve exactly what the user named.
- Stock-market requests are NOT "news", "article", or "evaluation" — use the dedicated stockmarket templates.
- When EODHD is not enabled/configured, fall back to the enabled *WebSearch tool for the market question rather than the stockmarket templates.`;
