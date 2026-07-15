export const IMAGELIST_INSTRUCTIONS = `MODE: IMAGELIST

Goal: produce a pure image collection — a titled, captioned gallery of images about the user's topic. The dashboard renders it as an image grid, not an article. The user explicitly asked for images ONLY, so prose must stay minimal.

STRUCTURE:
1. category is a short label such as Images, Gallery, Wallpapers, Photos.
2. title states what the collection shows (e.g. "Gothic Remake — Official Screenshots").
3. subtitle is ONE short sentence of context (what these images are and where they come from). No paragraphs.
4. galleryItems is the core deliverable: every suitable image from the image search results.

Required fields:
- category: a short label such as Images, Gallery, Wallpapers, Photos.
- title: the collection title; must not be empty.
- subtitle: one short sentence of context; empty string if nothing meaningful to add.
- galleryItems: an array of image objects. This is the entire point of the template — it MUST contain every suitable retrieved image up to imageTargetCount.

Gallery item rules:
- Each entry needs imageUrl, imageAlt, title, and caption. imageAlt and title MUST be non-empty.
- imageAlt describes the image content for accessibility (what is visibly depicted).
- title is a concise label (2-6 words), caption adds one short line of context (source, scene, or subject).
- If the tool result provides no title/alt, derive concise values from the query and topic. Never leave them empty.
- Carry over the metadata from availableImages verbatim: width, height, and source (the site name). Omit a field only when the tool result did not provide it.
- Use ONLY image URLs that appear in the tool results. Never invent or guess URLs.
- IMAGE DOMAIN RESTRICTION: only use image URLs from trusted sources. Reject Google thumbnail proxies (encrypted-tbn*.gstatic.com, t*.gstatic.com), data URIs, localhost, private IPs, and unknown hosts without a direct image file extension.
- Prefer 2560×1440 (1440p). 1280×720 (720p) is the enforced minimum; never use images below that resolution.
- Order images by relevance and visual quality — strongest first.
- Do not include near-duplicate images; the system deduplicates by content hash, but still pick the best representative yourself.

Optional fields:
- sources: an array of source objects with url, title, sourceName, date, and snippet. Use only real retrieved URLs to credit where the images were found.

Do NOT include:
- Long descriptions, articles, sections, key findings, or conclusions — the user wants images, not prose.
- Videos — the videolist template handles video collections.
- Hero images — every image lives in galleryItems so the grid stays uniform.

No-results rule:
- If the searches returned no usable images, set title to a concise statement such as 'No images found for <topic>' and use subtitle to explain that the search did not return authoritative image sources. Set galleryItems to an empty array.
- Do not invent image URLs to fill the gallery when no results were retrieved.`;
