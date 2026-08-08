export const SUMMARY_INSTRUCTIONS = `MODE: SUMMARY

Goal: produce a concise, accurate recap of the prior conversation or the topic the user requested.

STRUCTURE:
1. category labels the recap.
2. title is a concise, descriptive headline.
3. subtitle is an optional one-line summary.
4. summary is a 1–3 paragraph recap written as a single plain-text string.
5. keyFindings list 0–5 short takeaways.
6. sources cite previous tool results when available.

Required fields:
- category: a short label such as Summary, Recap, Overview.
- title: a concise, descriptive headline.
- subtitle: an optional one-line summary (empty string if not needed).
- summary: a 1–3 paragraph recap written as a single plain-text string with paragraphs separated by the escaped newline sequence \\n.
- keyFindings: an array of 0–5 short takeaways. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects with url and title. Only include real sources from previous tool results; otherwise use an empty array.

Optional media fields (use only when online research returns real images or videos):
- heroImageUrl: the single best image URL related to the summary.
- heroImageAlt: a short accessibility description for the hero image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the hero image.
- heroVideoUrl: the single best video URL related to the summary. Prefer heroVideoUrl over heroImageUrl when both are available. Take it from videoSearch results or from a vetted video link inside web/fetch results; videoGalleryItems must come from videoSearch results only. Only use URLs from supported providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files.
- heroVideoCaption: an optional caption for the hero video.
- heroVideoTitle: the hero video's title copied verbatim from its availableVideos entry. REQUIRED (non-empty) whenever heroVideoUrl is set — the dashboard displays it in the playlist, the video popout title bar, and the now-playing text. Empty string only when there is no hero video.
- galleryTitle: a short title for an image gallery (e.g., "Gallery").
- galleryItems: an array of image objects when multiple relevant images are available. Each entry must include imageUrl, imageAlt, title, and caption. imageAlt and title MUST be non-empty. When online research returns image URLs, populate galleryItems with the remaining images (excluding any hero), up to imageTargetCount — aim for at least 3 when enough URLs are available; with fewer available images, include all of them. Use imageSearch URLs only; never use low-resolution news thumbnails.
- videoGalleryTitle: a short title for a video gallery.
  - videoGalleryItems: an array of video objects when multiple relevant videos are available. Each entry must include videoUrl, title, and caption. title and caption MUST be non-empty. When online research returns video URLs, populate videoGalleryItems with the remaining videos (excluding any hero video), up to videoTargetCount — aim for at least 3 when enough URLs are available. Only use supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Respect videoTargetCount from the tool context. Carry over the metadata from its availableVideos entry verbatim when the tool result provides it: duration, channel, date, views, thumbnailUrl, description.
- Hero and galleries never share URLs: every imageUrl and videoUrl may appear only once across heroImageUrl, heroVideoUrl, galleryItems, and videoGalleryItems.

No-results rule:
- If there is no relevant context to summarize, state that honestly instead of fabricating content.`;
