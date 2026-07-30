export const NEWS_INSTRUCTIONS = `MODE: NEWS ARTICLE

Goal: produce a well-structured news article the dashboard will render as a news card.

STRUCTURE: use the inverted pyramid. Lead with the most important facts and support them with detail.
1. Headline states the key fact concisely.
2. Deck adds one line of context or sub-headline.
3. Lead answers who, what, when, where, why, and how in 2-4 sentences.
4. Key points give 3-5 scan-friendly takeaways.
5. Section content adds 3-6 paragraphs of supporting detail: context, quotes, reactions, and background.
6. Sources attribute every claim with URL, title, sourceName, date, and snippet.

Required fields (all string values; use "" or [] when data is unavailable):
- headline: a concise, factual headline.
- deck: an optional one-line sub-headline (empty string if not needed).
- category: a short label such as News, Tech, Gaming, World, Business.
- lead: a 2-4 sentence paragraph that answers the core question and states the strongest facts.
- sectionTitle: a heading for the main body section; empty string if not needed.
- sectionContent: the main body text as a single plain-text string. Write 3-6 paragraphs with quotes, context, and supporting detail.

Optional fields (include only when the data is available; otherwise use "" or [] or omit the key entirely):
- heroImageUrl: a primary image URL from the retrieved images. Empty string if no image URLs were provided.
- heroImageAlt: a short alt text for the hero image; empty string if no hero image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the hero image; empty string if none.
- heroVideoUrl: a video URL from videoSearch or webSearch results. Only use URLs from supported providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. The dashboard will convert it to an embedded player automatically. Empty string if none.
- heroVideoCaption: optional caption for the hero video; empty string if none.
- heroVideoTitle: the hero video's title copied verbatim from its availableVideos entry. REQUIRED (non-empty) whenever heroVideoUrl is set — the dashboard displays it in the playlist, the video popout title bar, and the now-playing text. Empty string only when there is no hero video.
- galleryTitle: heading for an inline image gallery; empty string if none.
- galleryItems: an array of image objects for the inline gallery. Each item needs imageUrl, imageAlt, title, caption. imageAlt and title MUST be non-empty. When imageSearch returns 3 or more images, include the additional images here (excluding any hero image).
  - videoGalleryItems: an array of additional video objects when multiple videos are available. Each item needs videoUrl, title, caption. title and caption MUST be non-empty. videoUrl must be from a supported provider (YouTube, Vimeo, Dailymotion, Loom, Wistia) or a direct video file. Carry over the metadata from its availableVideos entry verbatim when the tool result provides it: duration, channel, date, views, thumbnailUrl, description.
- videoGalleryTitle: heading for the video gallery (e.g. 'Related coverage'); empty string if none.
- keyPoints: an array of 3-5 short bullet points. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects with url, title, sourceName, date, and snippet. Use only real retrieved URLs.
- relatedStories: an array of up to 6 related story cards. Each card needs title, url, sourceName, date, imageUrl. title and url MUST be non-empty; imageUrl only when a distinct verified imageSearch image remains — drop the card otherwise. Use only real retrieved URLs.
- dateline: when and where the story is from (e.g. "2026-07-11, Gaza"). Empty string if unknown.
- byline: the author or originating outlet (e.g. "Reuters" or "Jane Doe, BBC"). Empty string if unknown.
- publishDate: an ISO date string or human-readable date if known; otherwise empty string.
- readTime: leave empty. The dashboard computes read time automatically.

MANDATORY MEDIA SEARCH:
- The news template ALWAYS runs imageSearch and videoSearch in parallel with webSearch and newsSearch.
- You MUST use the returned image URLs and video URLs. Do not leave heroImageUrl, heroVideoUrl empty when corresponding tool results were provided.
- Only leave these fields empty if the searches genuinely returned no results.
- When selecting images (including relatedStories thumbnails), prefer 2560×1440 (1440p). 1280×720 (720p) is the enforced minimum; never use images below that resolution.
- IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (configured blocked sources), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.
- VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.
- Pool ownership: every image comes from imageSearch results. heroVideoUrl may take the best vetted video from videoSearch or from links inside web/news article results; videoGalleryItems must come from videoSearch results only.

Hero media priority:
1. If a relevant video URL is available from videoSearch, set heroVideoUrl.
2. If a relevant image URL is available from imageSearch, set heroImageUrl.
3. The dashboard renders only one hero medium: video first, then image. If both are set, it will show the video and use the image as fallback if the video cannot be embedded.
4. Do NOT leave both heroImageUrl and heroVideoUrl empty when corresponding results were provided.

IMPORTANT: videos and images are INDEPENDENT media types.
- Setting heroVideoUrl does NOT exempt you from populating galleryItems.
- If imageSearch returned URLs, you MUST put the remaining images (after any hero image) into galleryItems up to imageTargetCount.
- Do not leave galleryItems empty just because a hero video is present.
- Likewise, videoGalleryItems must be populated when extra videos are available, regardless of whether heroImageUrl is set.

Source rules:
- Every source must include url and title.
- When the article provides a publisher/source name, include it as sourceName.
- When the article provides a date or age, include it as date.
- When the article provides a snippet, include it as snippet.
- Do not emit sources unless the retrieved results provided real URLs.

Gallery rules:
- relatedStories thumbnails MUST come from imageSearch results, not from newsSearch thumbnails. newsSearch thumbnails are often below 720p and must not be used as card images.
- When imageSearch returns 3 or more images, include the additional images in galleryItems for the inline gallery (excluding any hero image) AND assign distinct images to relatedStories card thumbnails when enough remain.
- Never reuse an image across hero, gallery, and relatedStories thumbnails — a card without its own distinct image gets an empty imageUrl or is dropped.
- For videos, only use direct video pages from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Never use channel, playlist, user, or profile URLs.
- Do not exceed imageTargetCount for total images or videoTargetCount for total videos.
- Count heroImageUrl + galleryItems + relatedStories imageUrls together toward imageTargetCount.
- relatedStories are asides: every card's url must be unique across the response and must not repeat any source url; every card's imageUrl must differ from heroImageUrl and every galleryItems imageUrl; write fresh teaser titles that do not restate the headline, deck, or lead.

No-results rule:
- If all retrieved results are empty, set headline to a concise statement such as "No results found for <topic>" and use lead to explain that searches did not return authoritative sources.
- Do not invent facts, dates, or URLs to fill empty fields when no results were retrieved.`;
