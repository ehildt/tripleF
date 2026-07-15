import { parseYouTubeId } from './parse-youtube-id.helper';

const YOUTUBE_HOSTS = new Set([
  'www.youtube.com',
  'youtube.com',
  'm.youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
]);

const DAILYMOTION_HOSTS = new Set([
  'dailymotion.com',
  'www.dailymotion.com',
  'dai.ly',
]);

function parseDailymotionId(url: URL): string | null {
  if (url.hostname === 'dai.ly') {
    return url.pathname.slice(1).split('/')[0] || null;
  }
  return /^\/video\/([a-z0-9]+)/i.exec(url.pathname)?.[1] ?? null;
}

/**
 * Derive a poster image URL for a video page URL, for providers with a
 * deterministic thumbnail pattern (YouTube, Dailymotion). Returns null for
 * everything else — callers fall back to the thumbnailUrl from search
 * results or a plain backdrop.
 */
export function buildVideoPosterUrl(videoUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return null;
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = parseYouTubeId(url);
    // mqdefault is YouTube's only always-available 16:9 thumbnail variant —
    // hqdefault/sddefault are 4:3 and maxresdefault is not guaranteed to
    // exist, so those crop or letterbox in a 16:9 frame.
    return id
      ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/mqdefault.jpg`
      : null;
  }

  if (DAILYMOTION_HOSTS.has(url.hostname)) {
    const id = parseDailymotionId(url);
    return id
      ? `https://www.dailymotion.com/thumbnail/video/${encodeURIComponent(id)}`
      : null;
  }

  return null;
}
