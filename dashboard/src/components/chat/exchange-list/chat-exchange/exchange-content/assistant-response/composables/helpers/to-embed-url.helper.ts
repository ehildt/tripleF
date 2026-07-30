import { parseYouTubeId } from './parse-youtube-id.helper';

const YOUTUBE_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const VIMEO_HOSTS = new Set(['vimeo.com', 'www.vimeo.com', 'player.vimeo.com']);

const DAILYMOTION_HOSTS = new Set([
  'dailymotion.com',
  'www.dailymotion.com',
  'dai.ly',
]);

const LOOM_HOSTS = new Set(['loom.com', 'www.loom.com']);

const WISTIA_HOSTS = new Set([
  'wistia.com',
  'www.wistia.com',
  'home.wistia.com',
  'fast.wistia.net',
]);

const DIRECT_VIDEO_EXTENSION =
  /\.(mp4|webm|ogg|mov|mkv|avi|flv|m3u8|mpd)(\?.*)?$/i;

/**
 * YouTube embeds use the stock youtube.com domain. The privacy-enhanced
 * nocookie domain was tried and reverted: its player misbehaves with
 * multiple concurrent embeds on one page (the second player starts muted
 * with a stuck buffering spinner), while the stock player has years of
 * multi-embed hardening. The trade-off: the stock player fires DoubleClick
 * ad-conversion pixels that fail CORS — harmless console noise inside the
 * iframe, not an app error.
 */
function buildYouTubeEmbedUrl(url: URL): string | null {
  const id = parseYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
}

function buildVimeoEmbedUrl(url: URL, input: string): string | null {
  if (url.pathname.startsWith('/video/')) {
    return input;
  }
  const match = /^\/(\d+)\/?$/.exec(url.pathname);
  if (!match) return null;
  return `https://player.vimeo.com/video/${match[1]}`;
}

function parseDailymotionId(url: URL): string | null {
  if (url.hostname === 'dai.ly') {
    const id = url.pathname.slice(1).split('/')[0];
    return id || null;
  }
  const match = /^\/video\/([a-z0-9]+)/i.exec(url.pathname);
  return match?.[1] ?? null;
}

function buildDailymotionEmbedUrl(url: URL): string | null {
  const id = parseDailymotionId(url);
  if (!id) return null;
  return `https://www.dailymotion.com/embed/video/${encodeURIComponent(id)}`;
}

function parseLoomId(url: URL): string | null {
  const match = /^\/share\/([a-f0-9]{32})/i.exec(url.pathname);
  return match?.[1] ?? null;
}

function buildLoomEmbedUrl(url: URL): string | null {
  const id = parseLoomId(url);
  if (!id) return null;
  return `https://www.loom.com/embed/${encodeURIComponent(id)}`;
}

function parseWistiaId(url: URL): string | null {
  const match = /^\/embed\/iframe\/([a-z0-9]+)/i.exec(url.pathname);
  if (match) return match[1];
  const mediaMatch = /^\/medias\/([a-z0-9]+)/i.exec(url.pathname);
  if (mediaMatch) return mediaMatch[1];
  return /^\/[a-z0-9]+$/i.exec(url.pathname)?.[1].slice(1) ?? null;
}

function buildWistiaEmbedUrl(url: URL): string | null {
  const id = parseWistiaId(url);
  if (!id) return null;
  return `https://fast.wistia.net/embed/iframe/${encodeURIComponent(id)}`;
}

/**
 * Convert a video page URL into an embeddable iframe URL.
 * Supports YouTube, Vimeo, Dailymotion, Loom, Wistia and direct video files.
 * Returns null if the URL is not recognized, malformed, or not embeddable.
 *
 * Instagram, Facebook, TikTok, Twitch, X/Twitter and other platforms are
 * rejected because they block embeds, require authentication, or cannot be
 * embedded reliably.
 */
export function toEmbedUrl(input: string): string | null {
  if (!input) return null;

  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }

  // Protocol gate first: the direct-file passthrough returns the input
  // verbatim, so non-http(s) URLs (javascript:, data:) must never get that
  // far — they would land in an iframe or <video> source unchanged.
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  if (YOUTUBE_HOSTS.has(url.hostname)) return buildYouTubeEmbedUrl(url);
  if (VIMEO_HOSTS.has(url.hostname)) return buildVimeoEmbedUrl(url, input);
  if (DAILYMOTION_HOSTS.has(url.hostname)) return buildDailymotionEmbedUrl(url);
  if (LOOM_HOSTS.has(url.hostname)) return buildLoomEmbedUrl(url);
  if (WISTIA_HOSTS.has(url.hostname)) return buildWistiaEmbedUrl(url);

  // Pass through direct video files only.
  if (DIRECT_VIDEO_EXTENSION.test(url.pathname)) return input;

  return null;
}
