/**
 * Canonical YouTube link shapes. The video ID is exactly 11 characters
 * right after the provider prefix and must be followed by a boundary (end
 * of string, a parameter separator, or contamination glue) — a longer run
 * of ID characters means the ID itself is unrecoverable, not that we can
 * snip off the first 11. Boundary-terminated capture is the same pattern
 * established URL parsers use (get-video-id, js-video-url-parser).
 */
const YOUTUBE_LINK_PATTERN =
  /^https?:\/\/(?:[a-z0-9-]+\.)*youtube\.com\/(?:watch\?v=|shorts\/|embed\/|live\/|v\/|e\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;

const YOUTU_BE_LINK_PATTERN = /^https?:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;

const YOUTUBE_NOCOOKIE_LINK_PATTERN =
  /^https?:\/\/(?:www\.)?youtube-nocookie\.com\/(?:embed\/|v\/)([A-Za-z0-9_-]{11})(?![A-Za-z0-9_-])/;

/** Any YouTube-family host, regardless of the ID that follows it. */
const YOUTUBE_HOST_PATTERN = /^https?:\/\/(?:[a-z0-9-]+\.)*youtube(?:-nocookie)?\.com\/|^https?:\/\/youtu\.be\//;

/**
 * Characters that can never appear unescaped in a valid URL. Search
 * providers occasionally glue result markup onto links (Serper's videos
 * endpoint returned "…watch?v=ID:J<b>Title</b>B\ufffd"), so a link
 * containing any of these cannot be trusted: for non-YouTube providers the
 * true URL boundary is unrecoverable.
 */
const CONTAMINATION_PATTERN = /[\s"'<>\uFFFD]/;

/**
 * Repair a video search result link before it reaches the model or the
 * media pool.
 *
 * YouTube links are rebuilt as the canonical watch URL from the intact
 * 11-char ID — this collapses watch/shorts/embed/share-link variants onto
 * one form and strips any contamination glued after the ID. A
 * YouTube-shaped link without a valid ID is dropped (real YouTube IDs are
 * exactly 11 characters; anything else is corruption). Other providers'
 * links pass through only when clean; contaminated ones are dropped.
 *
 * Returns undefined for links that must not surface to the model.
 */
export function repairVideoLink(link: string): string | undefined {
  if (!link) return undefined;

  const id =
    YOUTUBE_LINK_PATTERN.exec(link)?.[1] ??
    YOUTU_BE_LINK_PATTERN.exec(link)?.[1] ??
    YOUTUBE_NOCOOKIE_LINK_PATTERN.exec(link)?.[1];
  if (id) return `https://www.youtube.com/watch?v=${id}`;

  if (YOUTUBE_HOST_PATTERN.test(link)) return undefined;

  return CONTAMINATION_PATTERN.test(link) ? undefined : link;
}
