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
 * Ordered poster candidates for a video page URL, best quality first, for
 * providers with a deterministic thumbnail pattern (YouTube, Dailymotion).
 * Returns an empty array for everything else.
 *
 * YouTube: maxresdefault is the full 1280x720 frame; hqdefault/mqdefault are
 * progressively lower fallbacks for videos that never published a high-res
 * thumbnail (maxresdefault is not guaranteed to exist). Callers walk the list
 * on image error so a missing high-res never leaves a broken poster.
 */
export function buildVideoPosterCandidates(videoUrl: string): string[] {
  let url: URL;
  try {
    url = new URL(videoUrl);
  } catch {
    return [];
  }

  if (YOUTUBE_HOSTS.has(url.hostname)) {
    const id = parseYouTubeId(url);
    if (!id) return [];
    const base = `https://i.ytimg.com/vi/${encodeURIComponent(id)}/`;
    return [
      `${base}maxresdefault.jpg`,
      `${base}hqdefault.jpg`,
      `${base}mqdefault.jpg`,
    ];
  }

  if (DAILYMOTION_HOSTS.has(url.hostname)) {
    const id = parseDailymotionId(url);
    return id
      ? [
          `https://www.dailymotion.com/thumbnail/video/${encodeURIComponent(id)}`,
        ]
      : [];
  }

  return [];
}

/**
 * Derive the best-quality poster image URL for a video page URL. Returns the
 * highest-resolution candidate (null when none exists); callers that need a
 * graceful degradation should use `buildVideoPosterCandidates` and fall back
 * on image error.
 */
export function buildVideoPosterUrl(videoUrl: string): string | null {
  return buildVideoPosterCandidates(videoUrl)[0] ?? null;
}
