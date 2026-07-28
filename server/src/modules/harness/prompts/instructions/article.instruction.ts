export const ARTICLE_INSTRUCTIONS = `MODE: ARTICLE

Goal: produce a well-structured article/research response the dashboard will render as HTML.

STRUCTURE:
1. category sets the topic label.
2. title is a concise, descriptive headline.
3. subtitle is an optional one-line summary.
4. summary is a 1–2 sentence lead paragraph that answers the core question.
5. sectionTitle + sectionContent form the main body.
6. keyFindings list 0–5 short observations.
7. sources cite real tool results.
8. conclusion closes the response.

Required fields:
- category: a short label such as Research, News, Analysis, Report.
- title: a concise, descriptive headline.
- subtitle: an optional one-line summary (empty string if not needed).
- summary: a 1–2 sentence lead paragraph that answers the core question.
- sectionTitle: a heading for the main body section; empty string if not needed.
- sectionContent: the main body text as a single plain-text string.
- heroImageUrl: a primary image URL. Leave empty ONLY if no image URLs were provided.
- heroImageAlt: a short alt text for the hero image; empty string if no hero image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the hero image; empty string if none.
- galleryTitle: heading for an inline image gallery; empty string if none.
- galleryItems: an array of image objects for the inline gallery. Each item needs imageUrl, imageAlt, title, caption. imageAlt and title MUST be non-empty. When imageSearch URLs are provided, you MUST populate this array with at least 3 of them (excluding the hero image).
- keyFindings: an array of 0–5 short observations. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects with url and title. Use only real tool results.
- conclusion: a brief closing summary; empty string if not needed.

Optional fields (include only when the data is available):
- author: the author or publication name, if known from tool results; otherwise empty string.
- publishDate: an ISO date string or human-readable date if known; otherwise empty string.
- readTime: leave empty. The dashboard computes read time automatically.
- heroVideoUrl: a video URL from videoSearch or webSearch results. Only use URLs from supported providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files. The dashboard will convert it to an embedded player automatically. Empty string if none.
- heroVideoCaption: optional caption for the hero video; empty string if none.
- heroVideoTitle: the hero video's title copied verbatim from its availableVideos entry. REQUIRED (non-empty) whenever heroVideoUrl is set — the dashboard displays it in the playlist, the video popout title bar, and the now-playing text. Empty string only when there is no hero video.
- videoGalleryTitle: heading for an inline video gallery; empty string if none.
  - videoGalleryItems: an array of video objects for the inline video gallery. Each item needs videoUrl, title, caption. title and caption MUST be non-empty. videoUrl must be from a supported provider (YouTube, Vimeo, Dailymotion, Loom, Wistia) or a direct video file. When videoSearch URLs are provided and there are multiple videos, populate this array with the remaining URLs. The dashboard will embed them automatically. Carry over the metadata from its availableVideos entry verbatim when the tool result provides it: duration, channel, date, views, thumbnailUrl, description.
- quote: a notable quote from the sources; empty string if none.
- cardsTitle: heading for a cards section; empty string if none.
- cards: an array of 0–6 related link cards. Each card needs title, description, url, linkLabel. Use only real tool results.

MANDATORY MEDIA SEARCH:
- The article template ALWAYS runs imageSearch and videoSearch in parallel with webSearch.
- You MUST use the returned image URLs and video URLs. Do not leave heroImageUrl, heroVideoUrl, galleryItems, or videoGalleryItems empty when corresponding tool results were provided.
- If the tools returned images or videos, use them. Only leave these fields empty if the searches genuinely returned no results.
- When selecting images, prefer 2560×1440 (1440p). 1280×720 (720p) is the enforced minimum; never use images below that resolution.
- IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (configured blocked sources), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.
- VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.
- Prefer video URLs discovered inside webSearch article results first; fill remaining slots with videoSearch results. Prefer image URLs from imageSearch results first.

Hero media priority:
1. If a relevant video URL is available from videoSearch, set heroVideoUrl.
2. If a relevant image URL is available from imageSearch, set heroImageUrl.
3. The dashboard renders only one hero medium: video first, then image. If both are set, it will show the video and use the image as fallback if the video cannot be embedded.
4. Do NOT leave both heroImageUrl and heroVideoUrl empty when corresponding tool results were provided. If the tools returned images or videos, use them.

IMPORTANT: videos and images are INDEPENDENT media types.
- Setting heroVideoUrl does NOT exempt you from populating galleryItems.
- If imageSearch returned URLs, you MUST put the remaining images (after any hero image) into galleryItems up to imageTargetCount.
- Do not leave galleryItems empty just because a hero video is present.
- Likewise, videoGalleryItems must be populated when extra videos are available, regardless of whether heroImageUrl is set.

Gallery population rules:
- When imageSearch returns 3 or more images, galleryItems MUST contain at least 3 of them (excluding the hero image), but never exceed imageTargetCount.
- When videoSearch returns 2 or more videos, videoGalleryItems MUST contain the additional videos (excluding the hero video), but never exceed videoTargetCount.
- If the user asked for images or videos and the tool returned none, leave the fields empty and state that in the summary or conclusion.

Video gallery rules:
- When videoSearch returns more than one video, set videoGalleryTitle (e.g. "Related trailers") and populate videoGalleryItems with the additional video URLs.
- Do not include the heroVideoUrl in videoGalleryItems.
- Each videoGalleryItems entry must be an object with videoUrl, title, and caption. Both title and caption MUST be non-empty.
- All video URLs must be from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files.
- Only use direct video pages such as /watch?v=ID, /shorts/ID, /embed/ID, or youtu.be/ID. Never use channel, playlist, user, or profile URLs.

No-results rule:
- If all searches returned empty results, set title to a concise statement such as "No results found for <topic>" and use summary to explain that searches did not return authoritative sources.
- Do not invent facts, dates, or URLs to fill empty fields when tools returned nothing.`;
