/**
 * A YouTube ID is exactly 11 characters of [A-Za-z0-9_-]. Candidates
 * carrying glued-on markup (contaminated provider payloads, e.g.
 * "…watch?v=ID:J<b>Title</b>B\ufffd" — tool results from a Serper
 * regression where result-title HTML was appended to the link) still have
 * an intact ID prefix: salvage it, but only when a boundary follows, so a
 * longer ID-shaped run can never be mistaken for a real ID.
 */
const YOUTUBE_ID_SHAPE = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_ID_PREFIX = /^[A-Za-z0-9_-]{11}(?![A-Za-z0-9_-])/;

function asVideoId(candidate: string | null): string | null {
  if (!candidate) return null;
  if (YOUTUBE_ID_SHAPE.test(candidate)) return candidate;
  const match = YOUTUBE_ID_PREFIX.exec(candidate);
  return match ? match[0] : null;
}

/**
 * Extract the video ID from a YouTube URL (watch, share, shorts, live,
 * embed, or legacy inline-player forms). Returns null for channel, playlist,
 * and malformed URLs.
 *
 * Mirrors `repairVideoLink` in @triplef/agent — the display-time extraction
 * the dashboard applies to whatever URL reached it (historical conversation
 * payloads may carry pre-repair contamination) — keep the shape rules in
 * sync.
 */
export function parseYouTubeId(url: URL): string | null {
  if (url.hostname === 'youtu.be') {
    return asVideoId(url.pathname.slice(1).split('/')[0] || null);
  }
  if (url.pathname.startsWith('/shorts/')) {
    return asVideoId(
      url.pathname.slice('/shorts/'.length).split('/')[0] || null,
    );
  }
  if (
    url.pathname.startsWith('/embed/') ||
    url.pathname.startsWith('/live/') ||
    url.pathname.startsWith('/v/') ||
    url.pathname.startsWith('/vi/') ||
    url.pathname.startsWith('/e/')
  ) {
    return asVideoId(url.pathname.slice(1).split('/')[1] || null);
  }
  if (url.pathname.startsWith('/channel/') || url.pathname.startsWith('/@')) {
    return null;
  }
  if (url.pathname.startsWith('/playlist')) {
    return null;
  }
  return asVideoId(url.searchParams.get('v') || url.searchParams.get('vi'));
}
