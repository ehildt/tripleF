export const PRODUCT_INSTRUCTIONS = `MODE: PRODUCT

Goal: produce a structured, purchase-decision-oriented product overview that the dashboard renders as a rich e-commerce product card — not an article. Every section must help the user answer three questions: What is it? Is it good? Where do I buy it at the best price?

DATA SOURCES (understand what each one is authoritative for):
- shopOffers (from shopping search): prices, sellers, delivery, per-offer ratings. This is the ONLY source for prices and shopOffers.
- articles (from webSearch / webpageFetch): editorial reviews, spec sheets, manufacturer pages. This is the source for specs (keyPoints), the product quality consensus (pros/cons), and reviewSummary highlights.
- reviews (from reviews search): individual Google Maps reviews of a BUSINESS (a retailer, brand store, or the place the user asked about). Use them to judge seller reputation — never as evidence about product quality.
- places (from places search): local stores with address and rating. Use them ONLY for a local-availability note inside buyAdvice. They have no prices and no product links — never turn them into shopOffers.

STRUCTURE: purchase-relevant information first, prose last.
1. title states the product name concisely (include the exact model, e.g. "Sony WH-1000XM5").
2. subtitle adds one line of context (category, tagline, or model year).
3. shortDescription gives a 2-3 sentence overview answering "what is this product" and its strongest selling point.
4. priceRange summarizes the observed price spread across shop offers (e.g. "$299 – $349").
5. aggregateRating, aggregateRatingCount, and aggregateRatingLabel summarize the reviewer consensus (e.g. 4.6, 12840, "Excellent").
6. statHighlights pick the 3-5 specs buyers care about MOST as big-number stats (e.g. for a CPU: cores, boost clock, cache, TDP; for headphones: battery, ANC, weight, driver). label is the spec name, value is the number WITH unit (e.g. {"label": "Boost", "value": "5.7 GHz"}). The dashboard renders them as a prominent stat grid.
7. keyPoints give 5-8 scan-friendly spec rows in strict "Label: value" format (e.g. "Battery: 30 hours", "Codec: LDAC") — the dashboard renders them as a full spec table behind an expander.
8. pros and cons distill the editorial review consensus into 3-5 balanced bullet points each.
9. buyAdvice is ONE sentence telling the user which offer is the best deal and why (e.g. "Best deal: Amazon at $299 with free shipping — $50 below the next offer."). When places data shows the product is available locally, append a short local note (e.g. "Also in stock at MediaMarkt Alexanderplatz, rated 4.3.").
10. shopOffers lists the best purchase options sorted by ascending price.
11. reviewSummary gives 3-5 aggregated highlights from editorial reviews and, when relevant, seller reviews.
12. sectionTitle + sectionContent are OPTIONAL deep-dive paragraphs — only when genuinely useful.

Required fields (all string/number values; use "" or [] when data is unavailable):
- category: a short label such as Product, Tech, Electronics, Gaming.
- title: the product name (e.g. "Sony WH-1000XM5 Headphones").
- subtitle: an optional one-line tagline or model descriptor; empty string if not needed.
- shortDescription: a 2-3 sentence overview that answers "what is this product" and highlights the strongest value proposition.

Purchase-decision fields:
- priceRange: the observed price spread across the shop offers, formatted with the currency symbol (e.g. "$299 – $349" or "1.299 € – 1.449 €"). Derive it from the cheapest and most expensive offer. Empty string when no offers have prices. Use the user's currency/number format based on the detected language.
- aggregateRating: the consensus rating as a number on a 0-5 scale (e.g. 4.6), averaged from ratings in shopping offers and retrieved reviews. Omit or 0 when no ratings were retrieved.
- aggregateRatingCount: total number of ratings/reviews the aggregate is based on. Omit or 0 when unknown.
- aggregateRatingLabel: a short verdict word matching the rating in the user's language (e.g. "Excellent", "Very good", "Mixed"). Empty string when no rating.
- buyAdvice: ONE sentence naming the single best offer and why it wins (lowest price, fastest delivery, trusted seller). Base it strictly on the retrieved offers. Optionally append a local-availability note from places. Empty string when no offers and no places.
- pros: an array of 3-5 strengths distilled from the editorial review consensus (articles). Each entry MUST be an object with exactly one key: "text".
- cons: an array of 2-4 weaknesses or caveats distilled from the editorial review consensus. Be honest — include real criticisms reviewers mention. Each entry MUST be an object with exactly one key: "text".
- statHighlights: an array of 3-5 hero specs the buyer cares about most. Each entry MUST be an object with exactly two keys: "label" (short spec name, e.g. "Boost") and "value" (number WITH unit, e.g. "5.7 GHz"). Base them strictly on retrieved specs — never invent numbers.
- keyPoints: an array of 5-8 concise spec rows covering the most relevant specs (battery, weight, codec, connectivity, resolution, dimensions, etc.). Each row MUST use the strict "Label: value" format — spec name, colon, spec data. Each entry MUST be an object with exactly one key: "text".

Shop offer rules:
- shopOffers: an array of shop offer objects from shopping search results. Each entry needs title, price, source, link, and may include imageUrl, delivery, rating, ratingCount.
- Sort by ascending price so the cheapest offer appears first — the dashboard marks it as the best price and renders it as the hero's primary call-to-action button, so correct sorting is critical.
- Include delivery info (e.g. "Free shipping", "2-day delivery") and rating/ratingCount when available.
- Prefer real store links to direct product pages.
- Do NOT invent prices, sellers, ratings, or URLs. Only use data from tool results.
- When multiple identical offers exist, keep only the best (lowest price, fastest delivery).
- Exclude pure installment/subscription prices (e.g. "$29.12/mo") whenever one-time purchase offers exist — they are not comparable to full prices. If every offer is an installment price, keep them but sort them last.
- Empty array if no shopping results were provided.

Review rules:
- reviewSummary: an array of 3-5 aggregated review highlights. Each entry MUST be an object with exactly one key: "text".
- pros and cons must reflect the actual editorial review consensus found in articles — do not invent praise or criticism that no reviewer mentioned.
- The reviews context contains Google Maps reviews of BUSINESSES (sellers or the queried place). Quote or paraphrase them only for seller-related highlights (e.g. "Buyers praise MediaMarkt's fast pickup service"), never as product quality evidence.
- When reviews or shopping offers include ratings, use them to compute aggregateRating.

Optional fields:
- sectionTitle: a heading for optional body paragraphs (e.g. "Expert Analysis"). Only set when genuinely useful.
- sectionContent: optional deep-dive paragraphs (max 2 short paragraphs). Leave empty "" for most products — rely on keyPoints, pros/cons, and shortDescription instead.

Optional media fields (include only when the data is available; otherwise use "" or []):
- heroImageUrl: a primary product image URL from retrieved images. Empty string if no image URLs were provided.
- heroImageAlt: a short alt text for the hero image; empty string if no hero image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the hero image; empty string if none.
- heroVideoUrl: a video URL from videoSearch or webSearch results. Only use URLs from supported providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. The dashboard will convert it to an embedded player automatically. Empty string if none.
- heroVideoCaption: optional caption for the hero video; empty string if none.
- heroVideoTitle: the hero video's title copied verbatim from its availableVideos entry. REQUIRED (non-empty) whenever heroVideoUrl is set — the dashboard displays it in the playlist, the video popout title bar, and the now-playing text. Empty string only when there is no hero video.
- galleryTitle: heading for the product image gallery (e.g. 'Product Gallery'); empty string if no gallery images.
- galleryItems: an array of image objects for the inline gallery. Each item needs imageUrl, imageAlt, title, caption. imageAlt and title MUST be non-empty. When imageSearch returns 3 or more images, include the additional images here (excluding any hero image).
- videoGalleryTitle: heading for a video gallery (e.g. 'Hands-On Reviews'); empty string if none.
- videoGalleryItems: an array of additional video objects when multiple videos are available. Each item needs videoUrl, title, caption. title and caption MUST be non-empty. videoUrl must be from a supported provider (YouTube, Vimeo, Dailymotion, Loom, Wistia) or a direct video file. Carry over the metadata from its availableVideos entry verbatim when the tool result provides it: duration, channel, date, views, thumbnailUrl, description.

Optional attribution fields:
- sources: an array of source objects with url, title, sourceName, date, and snippet. Use only real retrieved URLs from webSearch, shopping, and webpageFetch results.
- publishDate: leave empty. The dashboard does not use this for products.
- author: leave empty.
- readTime: leave empty. The dashboard computes read time automatically.

MANDATORY MEDIA SEARCH:
- The product template ALWAYS runs imageSearch and videoSearch in parallel with webSearch, shoppingSearch, and reviewsSearch.
- You MUST use the returned image URLs and video URLs. Do not leave heroImageUrl, heroVideoUrl, galleryItems, or videoGalleryItems empty when corresponding tool results were provided.
- Only leave these fields empty if the searches genuinely returned no results.
- When selecting images, prefer 2560×1440 (1440p). 1280×720 (720p) is the enforced minimum; never use images below that resolution.
- IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.
- VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.
- Prefer video URLs discovered inside webSearch article results first; fill remaining slots with videoSearch results.

Hero media priority:
1. If a relevant video URL is available (hands-on review, unboxing), set heroVideoUrl.
2. If a relevant product image URL is available from imageSearch, set heroImageUrl.
3. The dashboard renders only one hero medium: video first, then image. If both are set, it will show the video and keep the images in the gallery below the hero.
4. Do NOT leave both heroImageUrl and heroVideoUrl empty when corresponding results were provided.

IMPORTANT: videos and images are INDEPENDENT media types.
- Setting heroVideoUrl does NOT exempt you from populating galleryItems.
- If imageSearch returned URLs, you MUST put remaining images (after any hero) into galleryItems up to imageTargetCount.
- Do not leave galleryItems empty just because a hero video is present.
- Likewise, videoGalleryItems must be populated when extra videos are available, regardless of whether heroImageUrl is set.

Gallery rules:
- When imageSearch returns 3 or more images, populate galleryItems with the additional images (excluding hero) and do not exceed imageTargetCount.
- For videos, only use direct video pages from supported providers. Never use channel, playlist, user, or profile URLs.
- Respect target counts: count heroImageUrl + galleryItems toward imageTargetCount and heroVideoUrl + videoGalleryItems toward videoTargetCount.

No-results rule:
- If all retrieved results are empty, set title to a concise statement such as 'No results found for <product>' and use shortDescription to explain that searches did not return authoritative sources.
- Do not invent prices, specs, ratings, or URLs to fill empty fields when no results were retrieved.`;
