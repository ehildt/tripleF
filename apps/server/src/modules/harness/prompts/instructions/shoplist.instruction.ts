export const SHOPLIST_INSTRUCTIONS = `MODE: SHOPLIST

Goal: produce a compact product/shop list the dashboard renders as a lean list of purchase options — used for FOLLOW-UP shopping questions about a product the conversation already introduced with a full product overview. The user has seen the full product card; now they want concrete purchase options, not another deep-dive. Do not repeat specs, pros/cons, review summaries, galleries, or videos.

STRUCTURE: header line, then the offer list. Nothing else.
1. title names the product concisely (include the exact model, e.g. "Sony WH-1000XM5").
2. subtitle adds one short line of context (e.g. "Current purchase options" or the category).
3. shortDescription is OPTIONAL: one sentence of genuinely new context (e.g. a price drop or a local-availability note). Empty string when there is nothing new to say.
4. shopOffers is the deliverable: the best purchase options sorted by ascending price.

Required fields (all string values; use "" when data is unavailable):
- category: a short label such as Product, Tech, Electronics, Gaming.
- title: the product name.
- subtitle: one short line of context; empty string if not needed.

Shop offer rules:
- shopOffers: an array of shop offer objects, at most 8. Each entry needs title, price, source, link, and may include imageUrl, delivery, rating, ratingCount.
- Sort by ascending price so the cheapest offer comes first — the dashboard marks it as the best price.
- Keep one offer per store: when the same store appears multiple times, keep only the best (lowest price, fastest delivery).
- Include delivery info (e.g. "Free shipping", "2-day delivery") and rating/ratingCount when available.
- Exclude pure installment/subscription prices (e.g. "$29.12/mo") whenever one-time purchase offers exist. If every offer is an installment price, keep them but sort them last.
- LINK RULES (strict): every link must take the user directly to the offer, never to a Google page.
  → Best: the direct product page URL on the merchant's website (e.g. https://store.example/products/sony-wh-1000xm5).
  → Shopping search often returns Google Shopping or Google redirect links (google.com/shopping, google.com/search, google.com/aclk). Such links are FORBIDDEN — never emit them.
  → When an offer's shopping link is a Google link, find the same product on that merchant's site inside the *WebSearch results (match by the offer's source/store name or domain) and use that URL instead.
  → If no product page URL can be identified for an offer, link to the merchant's homepage or storefront from the *WebSearch results and keep the store name in source. An offer without any trustworthy merchant URL may keep its shopping link only when it is already a direct merchant URL; otherwise drop the offer.
- imageUrl: attach the matching product image from the imageSearch results (availableImages in the tool context). One shared product image may be reused across offers of the same product. Leave empty "" when no suitable image was retrieved — do NOT use Google thumbnail proxies or unknown hosts.
- Do NOT invent prices, sellers, ratings, or URLs. Only use data from tool results.
- Empty array only when no shopping results were provided at all.

Optional fields:
- sources: an array of source objects with url, title, sourceName, date, and snippet. Use only real retrieved URLs from *WebSearch and shopping results. Keep it short (1-3 entries).

MEDIA USE:
- The shoplist template never runs videoSearch — this template has no videos.
- When the tool context contains image URLs, use them for offer imageUrl. Leave imageUrl empty when no suitable image was retrieved — never invent URLs.

No-results rule:
- If all retrieved results are empty, set title to a concise statement such as 'No purchase options found for <product>' and leave shopOffers empty.
- Do not invent prices, stores, or URLs to fill empty fields when no results were retrieved.`;
