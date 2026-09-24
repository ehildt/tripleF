import { canonicalVideoId } from './canonical-video-id.helper';

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
 * Mirrors the server's video-url-keys helper so client dedup matches server
 * behavior.
 */
export function videoUrlKeys(url: string): string[] {
  const keys = [normalizeUrl(url)];
  const canonicalId = canonicalVideoId(url);
  if (canonicalId) keys.push(canonicalId);
  return keys;
}
