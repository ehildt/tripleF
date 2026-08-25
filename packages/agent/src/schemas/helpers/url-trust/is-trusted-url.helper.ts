import { BLOCKED_URL_HOSTS, NON_PAGE_EXTENSIONS } from '../../constants/url-trust.constants.js';

import { isPrivateOrLocalhost } from './is-private-or-localhost.helper.js';

function isYouTubeNonVideoPath(hostname: string, pathname: string): boolean {
  const lowerHost = hostname.toLowerCase();
  if (lowerHost !== 'youtube.com' && lowerHost !== 'www.youtube.com' && lowerHost !== 'm.youtube.com') {
    return false;
  }

  const lowerPath = pathname.toLowerCase();
  // Reject YouTube static asset / API / service worker paths.
  if (
    lowerPath.startsWith('/s/') ||
    lowerPath.startsWith('/static/') ||
    lowerPath.startsWith('/js/') ||
    lowerPath.startsWith('/css/') ||
    lowerPath.startsWith('/fonts/') ||
    lowerPath.startsWith('/yts/') ||
    lowerPath.startsWith('/iframe_api') ||
    lowerPath.startsWith('/sw.js') ||
    lowerPath.startsWith('/embed_config') ||
    lowerPath.startsWith('/get_video_info') ||
    lowerPath.startsWith('/api/')
  ) {
    return true;
  }

  return false;
}

/**
 * Returns true for a URL that is safe to use as an article, source,
 * related story, or card link.
 *
 * Rules:
 * 1. Only http/https protocols are accepted.
 * 2. Reject non-page file extensions (images, videos, scripts, styles, fonts, archives).
 * 3. Reject known thumbnail / proxy / low-resolution hosts.
 * 4. Reject YouTube non-video asset paths (e.g. /s/_/ytembeds/...).
 * 5. Reject private IP / localhost URLs unless the caller explicitly allows them.
 *    (Local services such as MinIO are handled by the image/video helpers, not here.)
 * 6. Everything else that is a valid public URL is accepted.
 */
export function isTrustedUrl(url: string, options: { allowPrivate?: boolean } = {}): boolean {
  if (!url) return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname;

  if (BLOCKED_URL_HOSTS.has(hostname)) {
    return false;
  }

  if (isYouTubeNonVideoPath(hostname, pathname)) {
    return false;
  }

  if (NON_PAGE_EXTENSIONS.test(pathname)) {
    return false;
  }

  if (!options.allowPrivate && isPrivateOrLocalhost(hostname)) {
    return false;
  }

  return true;
}
