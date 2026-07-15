function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

function extractYoutubeId(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase().replace(/^www\.|^m\./, '');

    if (host === 'youtu.be') {
      return parsed.pathname.slice(1).split('/')[0] || undefined;
    }
    if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const watchId = parsed.searchParams.get('v');
      if (watchId) return watchId;
      const match = parsed.pathname.match(/^\/(shorts|embed|live)\/([^/?]+)/);
      if (match) return match[2];
    }
  } catch {
    return undefined;
  }
  return undefined;
}

/**
 * Build the dedupe keys for a video URL: a normalized URL plus the canonical
 * YouTube video ID when the URL belongs to YouTube, so watch/shorts/embed/
 * youtu.be variants of the same video collapse onto one key.
 */
export function videoUrlKeys(url: string): string[] {
  const keys = [normalizeUrl(url)];
  const youtubeId = extractYoutubeId(url);
  if (youtubeId) keys.push(`youtube:${youtubeId}`);
  return keys;
}
