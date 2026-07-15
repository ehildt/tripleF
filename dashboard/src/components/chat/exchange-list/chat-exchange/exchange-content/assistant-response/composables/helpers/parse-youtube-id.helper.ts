/**
 * Extract the video ID from a YouTube URL (watch, share, shorts, live,
 * embed, or legacy inline-player forms). Returns null for channel, playlist,
 * and malformed URLs.
 */
export function parseYouTubeId(url: URL): string | null {
  if (url.hostname === 'youtu.be') {
    return url.pathname.slice(1).split('/')[0] || null;
  }
  if (url.pathname.startsWith('/shorts/')) {
    return url.pathname.slice('/shorts/'.length).split('/')[0] || null;
  }
  if (
    url.pathname.startsWith('/embed/') ||
    url.pathname.startsWith('/live/') ||
    url.pathname.startsWith('/v/') ||
    url.pathname.startsWith('/vi/') ||
    url.pathname.startsWith('/e/')
  ) {
    return url.pathname.slice(1).split('/')[1] || null;
  }
  if (url.pathname.startsWith('/channel/') || url.pathname.startsWith('/@')) {
    return null;
  }
  if (url.pathname.startsWith('/playlist')) {
    return null;
  }
  return url.searchParams.get('v') || url.searchParams.get('vi');
}
