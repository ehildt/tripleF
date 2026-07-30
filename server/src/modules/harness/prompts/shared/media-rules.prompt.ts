export const MEDIA_RULES = `MEDIA RULES
- Media-list templates (imagelist, videolist, shoplist) have NO hero media — their mode rules override every hero-related rule below.
- Use every provided image/video URL whenever applicable.
- The system removes duplicate media by content hash (images) and canonical provider ID or title (videos). Do not worry if the raw tool results contain duplicates; choose one representative for each unique piece of content.
- heroVideoUrl takes priority over heroImageUrl when both exist.
- Fill galleryItems and videoGalleryItems from the supplied media without exceeding imageTargetCount or videoTargetCount.
- Gallery entries require all mandatory fields.
- Prefer high-resolution images.
- Reject untrusted image hosts, thumbnails, private URLs, data URIs, tracking assets, and unsupported video providers.
- URL fields must point to real public webpages, never scripts, APIs, assets, or tracking endpoints.
- Images and videos are independent; never omit image galleries because videos exist.
- Every image MUST have a non-empty imageAlt and a non-empty title. If the tool result provides none, derive a concise title and alt from the query/topic/context.
- Every video gallery item MUST have a non-empty title and a non-empty caption. If the tool result provides none, derive concise values from the query/topic/context.
- Do not include the same video twice (same trailer, official video, or clip) in heroVideoUrl and videoGalleryItems combined. YouTube watch/shorts/embed/youtu.be variants of the same video count as duplicates.
- Do not include the same image twice (the same photo, cover, or artwork served smaller, larger, or with different query parameters) in heroImageUrl and galleryItems combined.
- Every media URL may appear exactly once in the response: a URL used in heroImageUrl, heroVideoUrl, galleryItems, or videoGalleryItems must not reappear in any other media field or aside element.

MEDIA POOLS
- Images come only from the image pool: imageSearch results (and uploaded user images on image tasks). Every image URL in heroImageUrl, galleryItems, image lists, and relatedStories thumbnails must come from the image pool — never from news thumbnails, article pages, or source links.
- heroVideoUrl may take the best vetted video from videoSearch or from links inside web/news article results; videoGalleryItems and video list items must come from videoSearch results only.
- shopping results fill shopOffers; reviews results fill reviewSummary and seller-reputation notes; places results only inform local-availability notes.
- webSearch, webFetch, and news results provide general information: prose, sources, cards, and relatedStories links.
- Spend each pool entry at most once: when a tool result is used in one field it must not reappear in any other field.

ASIDE ELEMENTS
- relatedStories, cards, and similar secondary elements are asides. They exist to pique the user's interest, never to repeat primary content.
- An aside must not reuse any URL, link, image, or video that already appears in the primary elements (hero media, galleries, sectionContent, or sources).
- An aside must not restate text from the primary elements (title, subtitle, summary, lead, keyFindings). Write fresh teaser copy for every aside.
- If no distinct material remains for asides after the primary elements are filled, omit the aside elements entirely.`;
