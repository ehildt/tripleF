export const PRODUCT_INSTRUCTIONS = `MODE: PRODUCT

Goal: produce a structured, purchase-decision-oriented product overview that the dashboard renders as a rich e-commerce product card — not an article. Every section must help the user answer three questions: What is it? Is it good? Where do I buy it at the best price?

DATA SOURCES (understand what each one is authoritative for):
- shopOffers (from shopping search): prices, sellers, delivery, per-offer ratings. This is the ONLY source for prices and shopOffers.
- articles (from webSearch / pageFetch): editorial reviews, spec sheets, manufacturer pages. This is the source for specs (keyPoints) and the product quality consensus (pros/cons).
- reviews (from reviews search): individual Google Maps reviews of a BUSINESS (a retailer, brand store, or the place the user asked about). Use them to judge seller reputation — never as evidence about product quality.
- places (from places search): local stores with address and rating. Use them ONLY to inform the aggregate rating context. They have no prices and no product links — never turn them into shopOffers.

STRUCTURE: purchase-relevant information first, prose last. The dashboard renders the product in this order: a full-width product banner image with an always-visible rating overlay, a brief description, the spec table, pros/cons, a video gallery of product reviews (max 3), the shopping links, then the sources.
1. title states the product name concisely (include the exact model, e.g. "Sony WH-1000XM5").
2. subtitle adds one line of context (category, tagline, or model year).
3. shortDescription gives a 2-3 sentence overview answering "what is this product" and its strongest selling point. The dashboard renders it as the brief description below the banner.
4. aggregateRating, aggregateRatingCount, and aggregateRatingLabel summarize the reviewer consensus (e.g. 4.6, 12840, "Excellent"). The dashboard renders them as an always-visible overlay on the product banner image.
5. statHighlights pick the 3-5 specs buyers care about MOST as big-number stats (e.g. for a CPU: cores, boost clock, cache, TDP; for headphones: battery, ANC, weight, driver). label is the spec name, value is the number WITH unit (e.g. {"label": "Boost", "value": "5.7 GHz"}). The dashboard renders them as a prominent stat grid.
6. keyPoints give 5-8 scan-friendly spec rows in strict "Label: value" format (e.g. "Battery: 30 hours", "Codec: LDAC") — the dashboard renders them as a full spec table.
7. pros and cons distill the editorial review consensus into 3-5 balanced bullet points each.
8. videoGalleryItems list up to 3 product-review videos (hands-on reviews, unboxings, long-term tests) — the dashboard renders them as a video gallery.
9. shopOffers lists the best purchase options sorted by ascending price.
10. sources lists the retrieved sources for attribution.

Required fields (all string/number values; use "" or [] when data is unavailable):
- category: a short label such as Product, Tech, Electronics, Gaming.
- title: the product name (e.g. "Sony WH-1000XM5 Headphones").
- subtitle: an optional one-line tagline or model descriptor; empty string if not needed.
- shortDescription: a 2-3 sentence overview that answers "what is this product" and highlights the strongest value proposition.

Purchase-decision fields:
- aggregateRating: the consensus rating as a number on a 0-5 scale (e.g. 4.6), averaged from ratings in shopping offers and retrieved reviews. Omit or 0 when no ratings were retrieved.
- aggregateRatingCount: total number of ratings/reviews the aggregate is based on. Omit or 0 when unknown.
- aggregateRatingLabel: a short verdict word matching the rating in the user's language (e.g. "Excellent", "Very good", "Mixed"). Empty string when no rating.
- pros: an array of 3-5 strengths distilled from the editorial review consensus (articles). Each entry MUST be an object with exactly one key: "text".
- cons: an array of 2-4 weaknesses or caveats distilled from the editorial review consensus. Be honest — include real criticisms reviewers mention. Each entry MUST be an object with exactly one key: "text".
- statHighlights: an array of 3-5 hero specs the buyer cares about most. Each entry MUST be an object with exactly two keys: "label" (short spec name, e.g. "Boost") and "value" (number WITH unit, e.g. "5.7 GHz"). Base them strictly on retrieved specs — never invent numbers.
- keyPoints: an array of 5-8 concise spec rows covering the most relevant specs (battery, weight, codec, connectivity, resolution, dimensions, etc.). Each row MUST use the strict "Label: value" format — spec name, colon, spec data. Each entry MUST be an object with exactly one key: "text".

Shop offer rules:
- shopOffers: an array of shop offer objects from shopping search results. Each entry needs title, price, source, link, and may include imageUrl, delivery, rating, ratingCount.
- Sort by ascending price so the cheapest offer appears first — the dashboard marks it as the best price and renders it as the hero's primary call-to-action button, so correct sorting is critical.
- Include delivery info (e.g. "Free shipping", "2-day delivery") and rating/ratingCount when available.
- LINK RULES (strict): every link must take the user directly to the offer, never to a Google page.
  → Best: the direct product page URL on the merchant's website (e.g. https://store.example/products/sony-wh-1000xm5).
  → Shopping search often returns Google Shopping or Google redirect links (google.com/shopping, google.com/search, google.com/aclk). Such links are FORBIDDEN — never emit them.
  → When an offer's shopping link is a Google link, find the same product on that merchant's site inside the webSearch results (match by the offer's source/store name or domain) and use that URL instead.
  → If no product page URL can be identified for an offer, link to the merchant's homepage or storefront from the webSearch results and keep the store name in source. An offer without any trustworthy merchant URL may keep its shopping link only when it is already a direct merchant URL; otherwise drop the offer.
- Do NOT invent prices, sellers, ratings, or URLs. Only use data from tool results.
- When multiple identical offers exist, keep only the best (lowest price, fastest delivery).
- Exclude pure installment/subscription prices (e.g. "$29.12/mo") whenever one-time purchase offers exist — they are not comparable to full prices. If every offer is an installment price, keep them but sort them last.
- Empty array if no shopping results were provided.

Review rules:
- pros and cons must reflect the actual editorial review consensus found in articles — do not invent praise or criticism that no reviewer mentioned.
- The reviews context contains Google Maps reviews of BUSINESSES (sellers or the queried place). Quote or paraphrase them only for seller-related highlights (e.g. "Buyers praise MediaMarkt's fast pickup service"), never as product quality evidence.
- When reviews or shopping offers include ratings, use them to compute aggregateRating.

Optional fields:
- (none — rely on keyPoints, pros/cons, and shortDescription for the body.)

Optional media fields (include only when the data is available; otherwise use "" or []):
- heroImageUrl: the primary product image URL from retrieved images. The dashboard renders it as a full-width product banner. Empty string if no image URLs were provided.
- heroImageAlt: a short alt text for the banner image; empty string if no banner image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the banner image; empty string if none.
- galleryTitle: heading for the product image gallery (e.g. 'Product Gallery'); empty string if no gallery images.
- galleryItems: an array of image objects for the inline gallery. Each item needs imageUrl, imageAlt, title, caption. imageAlt and title MUST be non-empty. When imageSearch returns 3 or more images, include the additional images here (excluding any banner image).
- videoGalleryTitle: heading for the video gallery (e.g. 'Hands-On Reviews'); empty string if none.
- videoGalleryItems: an array of up to 3 product-review video objects. Each item needs videoUrl, title, caption. title and caption MUST be non-empty. videoUrl must be from a supported provider (YouTube, Vimeo, Dailymotion, Loom, Wistia) or a direct video file. Carry over the metadata from its availableVideos entry verbatim when the tool result provides it: duration, channel, date, views, thumbnailUrl, description. The dashboard renders at most 3 videos, so pick the 3 most relevant product reviews.

Optional attribution fields:
- sources: an array of source objects with url, title, sourceName, date, and snippet. Use only real retrieved URLs from webSearch, shopping, and pageFetch results. Use the FULL source title verbatim — never truncate it. Search results often return titles already cut off with a trailing ellipsis ("…" or "..."); strip that trailing ellipsis and any trailing whitespace so the displayed title is complete.
- publishDate: leave empty. The dashboard does not use this for products.
- author: leave empty.
- readTime: leave empty. The dashboard computes read time automatically.

MANDATORY MEDIA SEARCH:
- The product template ALWAYS runs imageSearch and videoSearch in parallel with webSearch, shoppingSearch, and reviewsSearch.
- You MUST use the returned image URLs and video URLs. Do not leave heroImageUrl, galleryItems, or videoGalleryItems empty when corresponding tool results were provided.
- Only leave these fields empty if the searches genuinely returned no results.
- When selecting images, prefer 2560×1440 (1440p). 1280×720 (720p) is the enforced minimum; never use images below that resolution.
- IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (configured blocked sources), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.
- VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.
- Pool ownership: every image comes from imageSearch results. videoGalleryItems must come from videoSearch results only.

Hero media priority:
1. The product banner is IMAGE-ONLY. Set heroImageUrl to the best, most detailed product image from imageSearch. There is no hero video — the dashboard never renders a video in the banner.
2. Do NOT leave heroImageUrl empty when imageSearch returned a relevant product image.

IMPORTANT: videos and images are INDEPENDENT media types.
- If imageSearch returned URLs, you MUST put remaining images (after the banner) into galleryItems up to imageTargetCount.
- videoGalleryItems must be populated with up to 3 product-review videos when videoSearch returned them, regardless of whether heroImageUrl is set.

Gallery rules:
- When imageSearch returns 3 or more images, populate galleryItems with the additional images (excluding the banner) and do not exceed imageTargetCount.
- For videos, only use direct video pages from supported providers. Never use channel, playlist, user, or profile URLs.
- Respect target counts: count heroImageUrl + galleryItems toward imageTargetCount and videoGalleryItems toward videoTargetCount (max 3).

No-results rule:
- If all retrieved results are empty, set title to a concise statement such as 'No results found for <product>' and use shortDescription to explain that searches did not return authoritative sources.
- Do not invent prices, specs, ratings, or URLs to fill empty fields when no results were retrieved.`;
