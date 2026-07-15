import { BLOCKED_IMAGE_HOSTS } from '../constants/blocked-image-hosts.js';

/** Reputable image hosts and CDNs we explicitly trust. */
const TRUSTED_IMAGE_HOSTS = new Set([
  'i.imgur.com',
  'i.redd.it',
  'preview.redd.it',
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'images.unsplash.com',
  'images.pexels.com',
  'cdn.pixabay.com',
  'live.staticflickr.com',
  'farm1.staticflickr.com',
  'farm2.staticflickr.com',
  'farm3.staticflickr.com',
  'farm4.staticflickr.com',
  'farm5.staticflickr.com',
  'farm6.staticflickr.com',
  'farm7.staticflickr.com',
  'farm8.staticflickr.com',
  'farm9.staticflickr.com',
  'i.pinimg.com',
  'media.istockphoto.com',
  'assets.istockphoto.com',
  'media.gettyimages.com',
  'embed.gettyimages.com',
  // Social image CDNs (images are generally embeddable, unlike videos)
  'pbs.twimg.com',
  'cdninstagram.com',
  'scontent.cdninstagram.com',
  'scontent-iad3-1.cdninstagram.com',
  'graph.facebook.com',
  'scontent-iad3-1.xx.fbcdn.net',
  'scontent.xx.fbcdn.net',
  'static.xx.fbcdn.net',
  // Cloud/CDNs
  'res.cloudinary.com',
  'images.ctfassets.net',
  'cdn.shopify.com',
  'imgix.net',
  'wpmedia.roomsketcher.com',
  // Brave image CDN
  'tse1.mm.bing.net',
  'tse2.mm.bing.net',
  'tse3.mm.bing.net',
  'tse4.mm.bing.net',
]);

/** Direct image file extension pattern. */
const DIRECT_IMAGE_EXTENSION =
  /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|avif|svg|ico)(\?.*)?$/i;

/**
 * Returns true if an image URL is safe to render.
 *
 * Rules:
 * 1. Relative URLs are allowed (these point at our own storage/API).
 * 2. Only http/https protocols are accepted.
 * 3. Known thumbnail / proxy / low-resolution hosts are rejected.
 * 4. URLs ending in a common image file extension are accepted from any non-blocklisted host.
 * 5. URLs served by the explicit trusted-host allowlist are accepted even without a
 *    direct image file extension.
 * 6. Everything else is rejected.
 */
export function isTrustedImageUrl(url: string): boolean {
  if (!url) return false;

  // Relative storage URLs and self-contained data URIs (user uploads).
  if (url.startsWith('/') || url.startsWith('data:image/')) return true;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;

  const hostname = parsed.hostname.toLowerCase();

  // Blocked thumbnail / low-res hosts.
  if (BLOCKED_IMAGE_HOSTS.has(hostname)) return false;

  // Trusted allowlist.
  if (TRUSTED_IMAGE_HOSTS.has(hostname)) return true;

  // Direct image file extension accepts from any non-blocklisted public or private host.
  if (DIRECT_IMAGE_EXTENSION.test(parsed.pathname)) return true;

  return false;
}
