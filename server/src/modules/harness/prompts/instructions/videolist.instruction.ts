export const VIDEOLIST_INSTRUCTIONS = `MODE: VIDEOLIST

Goal: produce a pure video collection — a titled, captioned playlist of videos about the user's topic. The dashboard renders it as a numbered playlist with embedded players, not an article. The user explicitly asked for videos ONLY (e.g. music videos, trailers, clips), so prose must stay minimal.

STRUCTURE:
1. category is a short label such as Videos, Playlist, Music Videos, Trailers.
2. title states what the playlist contains (e.g. "Daft Punk — Music Videos").
3. subtitle is ONE short sentence of context (what these videos are and where they come from). No paragraphs.
4. videoGalleryItems is the core deliverable: every suitable video from the video search results, ordered like a playlist.

Required fields:
- category: a short label such as Videos, Playlist, Music Videos, Trailers.
- title: the playlist title; must not be empty.
- subtitle: one short sentence of context; empty string if nothing meaningful to add.
- videoGalleryItems: an array of video objects. This is the entire point of the template — it MUST contain every suitable retrieved video up to videoTargetCount.

History dedupe (ABSOLUTE):
- The conversation history may contain earlier videolist responses (JSON objects with a videoGalleryItems array).
- NEVER include a videoUrl that already appeared in an earlier videolist response — the user has already seen it.
- When the user asks for more videos (e.g. "more", "weitere", "next"), return ONLY fresh videos that are not in the history.
- If every retrieved video is already in the history, say so in the subtitle and return an empty videoGalleryItems array.

Video item rules:
- Each entry needs videoUrl, title, and caption. title and caption MUST be non-empty.
- title is the video's real title when known (e.g. the YouTube video title); caption adds one short line of context (channel, release year, or why it fits the request).
- If the tool result provides no title/caption, derive concise values from the query and topic. Never leave them empty.
- Carry over the metadata from availableVideos verbatim: duration, channel, date, views, thumbnailUrl, and description. Omit a field only when the tool result did not provide it.
- VIDEO PROVIDER RESTRICTION: only use video URLs from supported providers (YouTube, Vimeo, Dailymotion, Loom, Wistia) or direct video files. Reject Instagram, Facebook, TikTok, Twitch, X/Twitter, and other platforms that cannot be embedded reliably.
- Only use direct video pages — never channel, playlist, user, or profile URLs.
- Use ONLY video URLs that appear in the tool results. Never invent or guess URLs.
- Order the videos like a good playlist: most relevant and most popular first.
- Do not include the same video twice (same music video, trailer, or clip), even from different search tools.
- Cross-check every candidate videoUrl against the earlier videolist responses in the conversation before including it.
- When the user asks for videos from a specific platform (e.g. "on YouTube"), include ONLY videos from that platform.

Do NOT include:
- Long descriptions, articles, sections, key findings, or conclusions — the user wants videos, not prose.
- Images or image galleries — the imagelist template handles image collections.
- Hero videos — every video lives in videoGalleryItems so the playlist stays uniform.

No-results rule:
- If the searches returned no usable videos, set title to a concise statement such as 'No videos found for <topic>' and use subtitle to explain that the search did not return embeddable video sources. Set videoGalleryItems to an empty array.
- Do not invent video URLs to fill the playlist when no results were retrieved.
- The dashboard does not render sources for this template. Do not include a sources field.`;
