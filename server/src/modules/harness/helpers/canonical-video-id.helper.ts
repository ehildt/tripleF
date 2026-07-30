/**
 * Canonicalize an embeddable video URL to a provider-specific identity key:
 * `youtube:<id>`, `vimeo:<id>`, or `dailymotion:<id>`. Returns null for
 * unsupported providers so URL variants of the same video (watch page,
 * shorts, embed, share link, player domain) collapse onto one identity.
 */
export function canonicalVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();

    return (
      extractYouTubeId(parsed, host) ??
      extractVimeoId(parsed, host) ??
      extractDailymotionId(parsed, host)
    );
  } catch {
    return null;
  }
}

function extractYouTubeId(parsed: URL, host: string): string | null {
  const normalizedHost = host.replace(/^www\.|^m\./, '');

  if (normalizedHost === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id ? `youtube:${id}` : null;
  }

  if (
    normalizedHost === 'youtube.com' ||
    normalizedHost === 'youtube-nocookie.com'
  ) {
    const watchId = parsed.searchParams.get('v');
    if (watchId) return `youtube:${watchId}`;

    const match = /^\/(shorts|embed|live|v)\/([^/?]+)/.exec(parsed.pathname);
    if (match) return `youtube:${match[2]}`;
  }

  return null;
}

function extractVimeoId(parsed: URL, host: string): string | null {
  if (host === 'vimeo.com' || host === 'www.vimeo.com') {
    const match = /^\/(\d+)/.exec(parsed.pathname);
    return match ? `vimeo:${match[1]}` : null;
  }

  if (host === 'player.vimeo.com') {
    const match = /^\/video\/(\d+)/.exec(parsed.pathname);
    return match ? `vimeo:${match[1]}` : null;
  }

  return null;
}

function extractDailymotionId(parsed: URL, host: string): string | null {
  if (host === 'dai.ly') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id ? `dailymotion:${id}` : null;
  }

  if (host === 'dailymotion.com' || host === 'www.dailymotion.com') {
    const match = /\/video\/([a-zA-Z0-9]+)/.exec(parsed.pathname);
    return match ? `dailymotion:${match[1]}` : null;
  }

  return null;
}
