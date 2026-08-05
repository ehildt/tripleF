/** Extract lightweight response stats for logging from the raw JSON content. */
export function parseResponseStats(content: string) {
  try {
    const cleaned = content
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    const parsed = JSON.parse(cleaned) as Record<string, unknown>;

    return {
      heroImageUrl:
        typeof parsed.heroImageUrl === 'string' ? parsed.heroImageUrl : null,
      heroVideoUrl:
        typeof parsed.heroVideoUrl === 'string' ? parsed.heroVideoUrl : null,
      galleryItemCount: Array.isArray(parsed.galleryItems)
        ? parsed.galleryItems.length
        : null,
      videoGalleryItemCount: Array.isArray(parsed.videoGalleryItems)
        ? parsed.videoGalleryItems.length
        : null,
    };
  } catch {
    return {
      heroImageUrl: null,
      heroVideoUrl: null,
      galleryItemCount: null,
      videoGalleryItemCount: null,
    };
  }
}
