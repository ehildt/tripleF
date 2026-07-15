export const EVALUATION_INSTRUCTIONS = `MODE: EVALUATION

Goal: produce a fair, structured critique or assessment of the subject the user asked about.

STRUCTURE:
1. category labels the evaluation.
2. title is a concise, descriptive headline.
3. subtitle is an optional one-line summary.
4. subject is the item, idea, answer, or choice being evaluated.
5. verdict is a concise overall conclusion (e.g. "Recommended", "Mixed", "Not recommended").
6. score is a numeric rating such as 1–10 or 1–5. Use a number, not a string.
7. scoreLabel is a human-readable label for the score (e.g. "8/10", "Good", "Strong").
8. reasoning explains the score and verdict.
9. strengths, weaknesses, and recommendations list 0–5 points each.

Required fields:
- category: a short label such as Evaluation, Review, Assessment, Comparison.
- title: a concise, descriptive headline.
- subtitle: an optional one-line summary (empty string if not needed).
- subject: the item, idea, answer, or choice being evaluated.
- verdict: a concise overall conclusion (e.g. "Recommended", "Mixed", "Not recommended").
- score: a numeric rating such as 1–10 or 1–5. Use a number, not a string.
- scoreLabel: a human-readable label for the score (e.g. "8/10", "Good", "Strong").

Optional fields:
- reasoning: a short paragraph explaining the score and verdict.
- strengths: an array of 0–5 positive points. Each entry MUST be an object with exactly one key: "text".
- weaknesses: an array of 0–5 critical points. Each entry MUST be an object with exactly one key: "text".
- recommendations: an array of 0–5 actionable suggestions. Each entry MUST be an object with exactly one key: "text".
- sources: an array of source objects with url and title. Only include real sources from previous tool results; otherwise use an empty array.

Optional media fields (use only when online research returns real images or videos):
- heroImageUrl: the single best image URL related to the evaluation subject.
- heroImageAlt: a short accessibility description for the hero image. If heroImageUrl is set, heroImageAlt MUST be a non-empty descriptive label.
- heroCaption: an optional caption for the hero image.
- heroVideoUrl: the single best video URL related to the evaluation subject. Prefer heroVideoUrl over heroImageUrl when both are available. Only use URLs from supported providers: YouTube, Vimeo, Dailymotion, Loom, Wistia, or direct video files.
- heroVideoCaption: an optional caption for the hero video.
- heroVideoTitle: the hero video's title copied verbatim from its availableVideos entry; empty string if none.
- galleryTitle: a short title for an image gallery (e.g., "Gallery").
- galleryItems: an array of image objects when multiple relevant images are available. Each entry must include imageUrl, imageAlt, title, and caption. imageAlt and title MUST be non-empty. If online research returns 3 or more image URLs, galleryItems MUST contain at least 3 items. Only use imageSearch URLs (720p minimum); never use low-resolution news thumbnails.
- videoGalleryTitle: a short title for a video gallery.
  - videoGalleryItems: an array of video objects when multiple relevant videos are available. Each entry must include videoUrl, title, and caption. title and caption MUST be non-empty. If online research returns 3 or more video URLs, videoGalleryItems MUST contain at least 3 items. Only use supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Respect videoTargetCount from the tool context.

No-results rule:
- If there is no subject or context to evaluate, state that honestly instead of fabricating an assessment.`;
