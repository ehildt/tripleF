const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;

function extractYoutubeVideoId(url: string): string | undefined {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\.|^m\./, '');

  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return YOUTUBE_ID_PATTERN.test(id) ? id : undefined;
  }

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const watchId = parsed.searchParams.get('v');
    if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) return watchId;

    const pathMatch = parsed.pathname.match(/^\/(shorts|embed|live)\/([A-Za-z0-9_-]{11})/);
    if (pathMatch) return pathMatch[2];
  }

  return undefined;
}

/**
 * Derive a trusted thumbnail URL for a YouTube video page URL. Serper's own
 * video thumbnails are Google proxy images (blocked by our image trust
 * rules), while i.ytimg.com serves the full-size thumbnail directly.
 *
 * Emits the maxresdefault (1280x720) candidate — high resolution first —
 * but YouTube does not guarantee it exists for every video. Consumers must
 * degrade on failure (the dashboard poster chain probes and falls back to
 * hqdefault/mqdefault; the server scrubs thumbnails that fail validation).
 * Returns undefined for non-YouTube URLs.
 */
export function buildYoutubeThumbnailUrl(url: string): string | undefined {
  const id = extractYoutubeVideoId(url);
  return id ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg` : undefined;
}
