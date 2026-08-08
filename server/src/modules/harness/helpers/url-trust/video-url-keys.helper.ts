import { canonicalVideoId } from './canonical-video-id.helper.js';

function normalizeUrl(url: string): string {
  return url
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/$/, '');
}

/**
 * Build the dedupe keys for a video URL: a normalized URL plus the canonical
 * provider identity (YouTube, Vimeo, Dailymotion), so watch/shorts/embed/
 * share-link/player-domain variants of the same video collapse onto one key.
 *
 * The dashboard mirrors this helper so client-side dedup matches server
 * behavior — keep their key formats in sync.
 */
export function videoUrlKeys(url: string): string[] {
  const keys = [normalizeUrl(url)];
  const canonicalId = canonicalVideoId(url);
  if (canonicalId) keys.push(canonicalId);
  return keys;
}
