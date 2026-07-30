export const HISTORY_URLS_RULES = `HISTORY URLS
- The conversation history contains URLs from earlier answers and earlier tool results ("Previously shown" lists, sources, cards, links). They are stale references for context only — never available media and never current sources.
- MEDIA: every imageUrl, videoUrl, hero URL, and thumbnail in your response MUST come from the current tool context (availableImages / availableVideos) or the user's current uploads — never from the conversation history. History media URLs are unverified and are silently dropped from your response.
- SOURCES/LINKS: prefer sources from the current tool results. Re-cite a history source only when the task is a recap of this conversation and no current source covers the claim.`;
