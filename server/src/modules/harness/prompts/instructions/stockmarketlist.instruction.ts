export const STOCKMARKET_LIST_INSTRUCTIONS = `MODE: STOCKMARKET_LIST

Goal: produce a structured stock-market list that the dashboard renders as a market overview with a normalized relative-performance chart and a list of the requested instruments. The chart data (price history per instrument) is streamed to the client separately — you do NOT emit chart series. You write the overview narrative and the list items from the tool summaries.

DATA SOURCES (understand what each one is authoritative for):
- eodhdSearch results: resolved ticker codes and names for the instruments the user named.
- eodhdQuote summary: current price, change, change %. This is the ONLY source for each item's price/change/changeP.
- eodhdHistory summary: latest close and period change % per instrument. Feeds the overview narrative.
- eodhdNews results: recent headlines for grounding the overview.
- *WebSearch results: general market context and recent developments beyond the market-data feeds.
- eodhdFundamentals summary: company context when relevant.
- *VideoSearch results (e.g. serperVideoSearch, youtubeVideoSearch): market-wrap and explainer videos. This is the ONLY source for videoGalleryItems.

WEB SEARCH STRATEGY — a market answer is never single-query. Issue several *WebSearch calls IN PARALLEL with recency "week" or "month", covering: (a) the overall market or sector view ("<sector or indices> market outlook latest"), (b) each named instrument's latest developments ("<company> latest news"), and (c) shared drivers such as partners, suppliers, customers, and macro/regulatory shifts ("<company or sector> partners suppliers customers"). Ground summary and sources in these results; do not repeat near-identical queries.

STRUCTURE: overview first, then the list, then sources.
1. title states the market view concisely (e.g. "Tech Stocks Overview" or "NVDA, AMD & MSCI World").
2. subtitle adds one line of context (the market or the instrument set).
3. summary is a 2-4 sentence market overview: the overall tone (risk-on/risk-off), the standout movers, and any macro/news context from the tool results.
4. items lists each requested instrument with name, ticker, current price, change, and changeP. Only include instruments the user actually named — never invent or hardcode a watchlist. If the user asked for a generic market overview without naming instruments, include the major indices you resolved (e.g. S&P 500, Nasdaq, Dow) via eodhdSearch.
5. sources lists the retrieved sources for attribution.

Required fields (all string/number values; use "" or [] when data is unavailable):
- category: a short label such as Market, Stocks, Indices, ETFs.
- title: the market view title.
- subtitle: an optional one-line descriptor; empty string if not needed.
- summary: the market overview narrative.

List items:
- items: an array of instrument objects, each with:
  - name: the instrument name (e.g. "NVIDIA").
  - ticker: the EODHD ticker code (e.g. "NVDA.US").
  - price: the current price as a number from the quote summary. Omit or 0 when unavailable.
  - change: the absolute change as a number. Omit or 0 when unavailable.
  - changeP: the percent change as a signed number. Omit or 0 when unavailable.

Optional fields:
- referenceLines: an array of dashed horizontal price lines drawn on the chart, each with a numeric value, an optional label (e.g. "Support", "Resistance"), and an optional color as a theme token name (e.g. "accent-primary", "status-success", "status-error", "status-info", "harmony-1".."harmony-4"). Price levels MUST come from the eodhd tool summaries (e.g. the history summary's fiftyTwoWeekHigh/fiftyTwoWeekLow) — web-search prices may differ (splits, delayed feeds), so never use a non-EODHD price as a chart value. Do NOT emit a line at the current price or previous close (the price axis and legend already show them), and skip any level within ~0.5% of another. Do NOT use moving-average values (e.g. 50-day or 200-day MA) as reference lines — a moving average is a trend line, not a horizontal price level. Do not invent levels.
- markers: an array of chart annotations, each with a time (ISO date matching a history bar), a position ("aboveBar" or "belowBar"), a shape ("circle", "arrowUp", "arrowDown", or "square"), an optional color as a theme token name, and an optional text label. Only emit markers you can ground in the tool results.
- sources: an array of source objects with url, title, sourceName, date, snippet. Use only real retrieved URLs.
- videoGalleryTitle + videoGalleryItems: up to 6 relevant videos about the requested market/instruments, each with videoUrl, title, and caption — plus optional channel, date, views, duration, and thumbnailUrl from the video search results. Only use real retrieved video URLs; omit the whole field when no video tools ran.

RULES:
- Do NOT invent prices, changes, percentages, or instruments. Only use data from tool results.
- Do NOT emit chart series (history arrays) in the JSON — the client renders the normalized relative-performance chart from streamed chartData.
- If a tool returned an error (e.g. rate limit), surface it honestly in summary and leave the affected item's price/change empty. Never fabricate data to fill empty fields.
- No-results rule: if all retrieved results are empty, set title to a concise statement such as 'No market data found' and use summary to explain that searches did not return authoritative sources.`;
