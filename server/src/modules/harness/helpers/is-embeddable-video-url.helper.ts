const EMBEDDABLE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'vimeo.com',
  'www.vimeo.com',
  'player.vimeo.com',
  'dailymotion.com',
  'www.dailymotion.com',
  'dai.ly',
  'loom.com',
  'www.loom.com',
  'wistia.com',
  'www.wistia.com',
  'home.wistia.com',
  'fast.wistia.net',
]);

const YOUTUBE_VIDEO_PATHS = /^\/(watch|shorts|embed|live|v|vi|e)\//;

const DIRECT_VIDEO_EXTENSION =
  /\.(mp4|webm|ogg|mov|mkv|avi|flv|m3u8|mpd)(\?.*)?$/i;

/**
 * Parse a YouTube URL and return the video id if the path/search look valid.
 * Returns undefined for URLs whose search string contains another hostname
 * segment (a common hallucination pattern from the model), e.g.
 * https://www.youtube.com/watch?．com/watch?v=ID
 */
function youtubeUrlHasCleanPath(parsed: URL): boolean {
  const search = parsed.search.slice(1); // remove leading '?'
  // If the search string contains what looks like another domain or a
  // duplicated watch path, treat the URL as invalid.
  return !/https?:\/\/|\.com\/watch|\.com\/|www\.youtube\.com/.test(search);
}

/**
 * Return true only for URLs the dashboard can actually embed in an iframe
 * or play as a direct video file.
 *
 * Allowed providers: YouTube, Vimeo, Dailymotion, Loom, Wistia.
 * Instagram, Facebook, TikTok, Twitch, X/Twitter and other platforms are
 * rejected because they block embeds, require authentication, or cannot be
 * embedded reliably.
 *
 * We intentionally keep this as a focused custom helper rather than using a
 * general-purpose library such as `get-video-id` or `js-video-url-parser`.
 * Those libraries are great for extracting video IDs across many services, but
 * they are permissive (e.g. they extract IDs from thumbnails, attribution links,
 * Google redirects, or legacy user fragments). Our helper is stricter: it only
 * accepts URLs that are known to be embeddable pages on the platforms we
 * support, or direct video files.
 */
export function isEmbeddableVideoUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    if (DIRECT_VIDEO_EXTENSION.test(parsed.pathname)) return true;

    if (!EMBEDDABLE_HOSTS.has(parsed.hostname)) return false;

    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.length > 1;
    }

    if (
      parsed.hostname === 'youtube-nocookie.com' ||
      parsed.hostname === 'www.youtube-nocookie.com'
    ) {
      return parsed.pathname.startsWith('/embed/');
    }

    if (
      parsed.hostname === 'youtube.com' ||
      parsed.hostname === 'www.youtube.com' ||
      parsed.hostname === 'm.youtube.com'
    ) {
      const hasValidVideoPath =
        YOUTUBE_VIDEO_PATHS.test(parsed.pathname) ||
        parsed.searchParams.has('v') ||
        parsed.searchParams.has('vi');
      return hasValidVideoPath && youtubeUrlHasCleanPath(parsed);
    }

    if (
      parsed.hostname === 'vimeo.com' ||
      parsed.hostname === 'www.vimeo.com'
    ) {
      const match = /^\/(\d+)(?:\/$)?$/.exec(parsed.pathname);
      return match !== null;
    }

    if (parsed.hostname === 'player.vimeo.com') {
      return /^\/video\/\d+\/?$/.test(parsed.pathname);
    }

    if (
      parsed.hostname === 'dailymotion.com' ||
      parsed.hostname === 'www.dailymotion.com'
    ) {
      return /^\/video\/[a-z0-9]+/i.test(parsed.pathname);
    }

    if (parsed.hostname === 'dai.ly') {
      return parsed.pathname.length > 1;
    }

    if (parsed.hostname === 'loom.com' || parsed.hostname === 'www.loom.com') {
      return /^\/share\/[a-f0-9]{32}/i.test(parsed.pathname);
    }

    if (
      parsed.hostname === 'wistia.com' ||
      parsed.hostname === 'www.wistia.com' ||
      parsed.hostname === 'home.wistia.com' ||
      parsed.hostname === 'fast.wistia.net'
    ) {
      return (
        /^\/embed\/iframe\/[a-z0-9]+/i.test(parsed.pathname) ||
        /^\/medias\/[a-z0-9]+/i.test(parsed.pathname) ||
        /^\/[a-z0-9]+$/i.test(parsed.pathname)
      );
    }

    return false;
  } catch {
    return false;
  }
}
