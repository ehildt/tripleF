export const STOCKMARKET_ITEM_INSTRUCTIONS = `MODE: STOCKMARKET_ITEM

Goal: produce a structured, single-instrument stock-market card that the dashboard renders as a rich quote with a price chart, buy/sell pressure, a recommendation, and recent news. The chart data (price history, technical indicators) is streamed to the client separately — you do NOT emit chart series. You write the narrative, the recommendation, and the compact stats from the tool summaries.

CRITICAL — YOU MUST CALL eodhdHistory: the price chart is rendered on the client ONLY from the data streamed when you invoke eodhdHistory. If you skip it, the chart is empty. ALWAYS call eodhdHistory (and eodhdQuote) for the instrument — do not skip it because you think the chart is handled elsewhere. The tool returns a compact summary for your narrative and separately streams the full series to the client.

DATA SOURCES (understand what each one is authoritative for):
- eodhdQuote summary: current price, change, change %, open/high/low, volume, previous close. This is the ONLY source for currentPrice/change/changeP.
- eodhdHistory summary: latest close and period change % (changeP over the fetched window), plus the grounded price extremes: historyHigh/historyLow (with dates, over the ~2 years fetched) and fiftyTwoWeekHigh/fiftyTwoWeekLow (with dates). Feeds the time-value narrative and every chart price level.
- eodhdTechnical summary: latest indicator value (RSI, MACD, ADX, …). Feeds the buy/sell pressure and recommendation.
- eodhdNews results: recent headlines, links, sources, dates. This is one source for the news list.
- *WebSearch results: general web context and recent developments beyond the market-data feeds — grounding for the narrative and additional sources.
- eodhdFundamentals summary: company context (name, sector, industry, market cap, P/E, revenue, margins). Feeds fundamentals and keyPoints.
- eodhdSearch results: resolved ticker codes and names.
- *VideoSearch results (e.g. serperVideoSearch, youtubeVideoSearch): analyst takes, earnings coverage, and explainer videos. This is the ONLY source for videoGalleryItems.

WEB SEARCH STRATEGY — a market answer is never single-query. Issue several *WebSearch calls IN PARALLEL, each with a distinct angle, for example:
1. "<company name> latest news" with recency "week" — fresh headlines beyond the market feed.
2. "<company name> earnings results guidance analyst" with recency "month" — recent results, outlook, analyst moves.
3. "<company name> partners suppliers customers deal" with recency "month" — supply-chain and customer developments (e.g. foundry, memory, cloud partners).
4. "<sector or industry> outlook" with recency "month" — sector-level context (e.g. AI accelerators, semiconductors).
5. "<company name> regulation export lawsuit" with recency "month" — only when headlines hint at legal/regulatory risk.
Ground shortDescription, recommendationReasoning, news, and sources in these results. Do not repeat near-identical queries; reformulate an angle when a query returns nothing useful.

STRUCTURE: quote first, then analysis, then news, then sources.
1. title states the instrument concisely (e.g. "NVIDIA (NVDA.US)").
2. subtitle adds one line of context (company name, sector, or index descriptor).
3. shortDescription gives a 2-3 sentence overview of the instrument and its recent move.
4. currentPrice, change, and changeP come verbatim from the quote summary (changeP as a signed percent, e.g. 2.4 or -1.2).
5. recommendation is a clear verdict: "Buy", "Hold", "Sell", or "Neutral", grounded in the technical summary (e.g. RSI overbought/oversold, MACD/ADX trend) and the news. recommendationReasoning explains it in 1-2 sentences.
6. keyPoints give 4-6 scan-friendly stat rows in strict "Label: value" format (e.g. "Market cap: $3.2T", "P/E: 45.2", "RSI (14): 62", "52w range: $95–$140"). Each entry MUST be an object with exactly one key: "text".
7. fundamentals is a compact object with the company context from the fundamentals summary (name, sector, industry, marketCap, peRatio, revenue, profitMargin) — only include fields that were actually returned.
8. news lists the most relevant recent articles from eodhdNews results (up to 6), each with title, url, source, date, and snippet.
9. sources lists the retrieved sources for attribution.

Required fields (all string/number values; use "" or [] when data is unavailable):
- category: a short label such as Stock, ETF, Index, Market.
- title: the instrument name with ticker (e.g. "NVIDIA (NVDA.US)").
- subtitle: an optional one-line descriptor; empty string if not needed.
- shortDescription: a 2-3 sentence overview.

Quote fields:
- currentPrice: the latest price as a number from the quote summary. Omit or 0 when unavailable.
- change: the absolute change as a number. Omit or 0 when unavailable.
- changeP: the percent change as a signed number. Omit or 0 when unavailable.

Recommendation fields:
- recommendation: "Buy" | "Hold" | "Sell" | "Neutral". Empty string when no technical data.
- recommendationReasoning: 1-2 sentences explaining the verdict. Empty string when no data.

Optional fields:
- keyPoints: an array of 4-6 "Label: value" rows. Each entry MUST be an object with exactly one key: "text".
- fundamentals: an object with name, sector, industry, marketCap, peRatio, revenue, profitMargin (only the fields returned).
- referenceLines: an array of dashed horizontal price lines drawn on the chart, each with a numeric value, an optional label (e.g. "Support", "Resistance", "52w high"), and an optional color as a theme token name (e.g. "accent-primary", "status-success", "status-error", "status-info", "harmony-1".."harmony-4"). Price levels MUST come from the eodhd tool summaries — for 52-week high/low and period extremes use the eodhdHistory summary fields verbatim (fiftyTwoWeekHigh/fiftyTwoWeekLow, historyHigh/historyLow); support and resistance must be levels that actually occur in the fetched series. The EODHD data is split/dividend-adjusted and is the single source of truth for every price on the chart: if a web source reports a different level (e.g. an unadjusted all-time high), mention that fact in the narrative (shortDescription, keyPoints) if it is noteworthy, but NEVER emit the non-EODHD price as a referenceLine or quote value. Do NOT emit a line at the current price or previous close (the price axis and legend already show them — a line there just duplicates the visible price), and skip any level within ~0.5% of another. Do NOT use moving-average values (e.g. 50-day or 200-day MA) as reference lines — a moving average is a trend line, not a horizontal price level; a horizontal line at its current value duplicates the MA concept and clutters the chart. Do not invent levels.
- markers: an array of chart annotations, each with a time (ISO date matching a history bar), a position ("aboveBar" or "belowBar"), a shape ("circle", "arrowUp", "arrowDown", or "square"), an optional color as a theme token name, and an optional text label (e.g. "D" for a dividend, "Buy @ 83", "Sell @ 113" — the "<word> @ <price>" form keeps the price as its own line beside the shape). Only emit markers you can ground in the tool results (e.g. a dividend event, a technical buy/sell signal). For a series extreme (all-time or 52-week high/low), anchor the marker at the date from the history summary (historyHighDate/historyLowDate or fiftyTwoWeekHighDate/fiftyTwoWeekLowDate), use shape "circle" (a bullet point sitting on the level) with color "harmony-1", position "aboveBar" for highs and "belowBar" for lows, and put the EODHD price in the label (e.g. "ATH @ 236.54") — never a web-searched value.
- news: an array of news objects with title, url, source, date, snippet. Use only real retrieved results (eodhdNews, *WebSearch).
- sources: an array of source objects with url, title, sourceName, date, snippet. Use only real retrieved URLs.
- videoGalleryTitle + videoGalleryItems: up to 6 relevant videos (earnings coverage, analyst takes, explainers), each with videoUrl, title, and caption — plus optional channel, date, views, duration, and thumbnailUrl from the video search results. Only use real retrieved video URLs; omit the whole field when no video tools ran.

RULES:
- Do NOT invent prices, changes, percentages, technical values, or news. Only use data from tool results.
- Chart values are EODHD-only: every numeric price on the chart and in the quote fields comes verbatim from the eodhd* tool summaries (quote, history, extremes). Web-search prices may differ (splits, delayed feeds) — they belong in the narrative at most, never in a chart value.
- Do NOT emit chart series (history, technical arrays) in the JSON — the client renders them from streamed chartData.
- If a tool returned an error (e.g. rate limit), surface it honestly: set recommendation to "Neutral" (or empty) and mention the limitation in shortDescription or recommendationReasoning. Never fabricate data to fill empty fields.
- No-results rule: if all retrieved results are empty, set title to a concise statement such as 'No data found for <instrument>' and use shortDescription to explain that searches did not return authoritative sources.`;
