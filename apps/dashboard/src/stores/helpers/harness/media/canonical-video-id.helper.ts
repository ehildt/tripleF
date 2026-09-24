/**
 * Canonicalize an embeddable video URL to a provider-specific identity key:
 * `youtube:<id>`, `vimeo:<id>`, or `dailymotion:<id>`. Returns null for
 * unsupported providers so URL variants of the same video (watch page,
 * shorts, embed, share link, player domain) collapse onto one identity.
 *
 * Identity is what dedup keys off — never the URL string. Two URLs are the
 * same video iff they share a provider identity, regardless of host alias
 * (www/m/mobile/music/consent) or path/query shape.
 *
 * IDs are validated against the provider's exact shape and REJECTED when
 * they do not match, so a malformed/truncated ID can never become a junk
 * identity: a bad identity silently merges two videos (false merge) or
 * splits one into two keys (missed duplicate).
 *
 * Mirrors the server's canonical-video-id helper — keep key formats in sync.
 */
const YOUTUBE_ID_PATTERN = /^[\w-]{11}$/;

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
  // Drop routing-only subdomains (www, m, mobile, music) and the consent/
  // privacy host; the path/query still encode the video identity, so a music
  // or consent variant must collapse onto the same key as the watch page.
  const normalizedHost = host
    .replace(/^(www|m|mobile|music)\./, '')
    .replace(/^youtube-nocookie\.com$/, 'youtube.com');

  if (normalizedHost === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0] ?? '';
    return YOUTUBE_ID_PATTERN.test(id) ? `youtube:${id}` : null;
  }

  if (normalizedHost === 'youtube.com') {
    const watchId = parsed.searchParams.get('v') ?? '';
    if (watchId && YOUTUBE_ID_PATTERN.test(watchId)) {
      return `youtube:${watchId}`;
    }
    // /shorts/<id>, /embed/<id>, /live/<id>, legacy /v/<id>
    const match = /^\/(shorts|embed|live|v)\/([\w-]{11})/.exec(parsed.pathname);
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
