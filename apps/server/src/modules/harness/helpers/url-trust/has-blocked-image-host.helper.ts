import { BLOCKED_IMAGE_HOSTS } from '../../constants/blocked-image-hosts.js';

/** Return true when the url points to a known blocked image host. */
export function hasBlockedImageHost(url: string): boolean {
  if (!url || url.startsWith('/') || url.startsWith('data:image/'))
    return false;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  return BLOCKED_IMAGE_HOSTS.has(parsed.hostname.toLowerCase());
}
