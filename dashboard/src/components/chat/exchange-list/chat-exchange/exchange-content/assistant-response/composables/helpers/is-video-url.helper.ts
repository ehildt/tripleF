const VIDEO_HOSTS = new Set([
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

const VIDEO_EXTENSION = /\.(mp4|webm|ogg|mov|mkv|avi|flv|m3u8|mpd)(\?.*)?$/i;

/**
 * Decide whether a URL points to an actual video result.
 *
 * Search APIs sometimes return discussion pages (e.g. Reddit posts) as video
 * results; this helper drops those before they reach the UI or the model.
 *
 * The host whitelist is intentionally limited to platforms the dashboard can
 * actually embed (YouTube, Vimeo, Dailymotion, Loom, Wistia plus direct video
 * files). Hosts such as Instagram, TikTok, Twitch, X, Facebook, or generic
 * websites are rejected because they cannot be embedded reliably.
 */
export function isVideoUrl(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);
    if (VIDEO_EXTENSION.test(parsed.pathname)) return true;
    if (!VIDEO_HOSTS.has(parsed.hostname)) return false;

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

    return true;
  } catch {
    return false;
  }
}

function youtubeUrlHasCleanPath(parsed: URL): boolean {
  const search = parsed.search.slice(1);
  return !/https?:\/\/|\.com\/watch|\.com\/|www\.youtube\.com/.test(search);
}
