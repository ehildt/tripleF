/**
 * Known low-resolution / thumbnail / proxy domains that should never be
 * rendered as article or gallery images. These hosts typically serve
 * small thumbnails, tracking pixels, or hot-link-protected images and are
 * not acceptable as primary image URLs.
 */
const BLOCKED_IMAGE_HOSTS = new Set([
  // Google thumbnail proxies (low-res, frequently 404 when hot-linked)
  'encrypted-tbn0.gstatic.com',
  'encrypted-tbn1.gstatic.com',
  'encrypted-tbn2.gstatic.com',
  'encrypted-tbn3.gstatic.com',
  't0.gstatic.com',
  't1.gstatic.com',
  't2.gstatic.com',
  't3.gstatic.com',
  't4.gstatic.com',
  't5.gstatic.com',
  't6.gstatic.com',
  't7.gstatic.com',
  't8.gstatic.com',
  't9.gstatic.com',
  't10.gstatic.com',
  'news.gstatic.com',
  'books.gstatic.com',
  'maps.gstatic.com',
  // Google user-content thumbnails
  'lh1.googleusercontent.com',
  'lh2.googleusercontent.com',
  'lh3.googleusercontent.com',
  'lh4.googleusercontent.com',
  'lh5.googleusercontent.com',
  'lh6.googleusercontent.com',
]);

/**
 * Reputable image hosts and CDNs we explicitly trust even when the URL does
 * not end in a direct image file extension. Additions should be restricted to
 * well-known, reliable providers.
 */
const TRUSTED_IMAGE_HOSTS = new Set([
  // Popular image hosting
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

const DIRECT_IMAGE_EXTENSION =
  /\.(jpg|jpeg|png|gif|webp|bmp|tiff|tif|avif|svg|ico)(\?.*)?$/i;

function isPrivateOrLocalhost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) return true;
  if (lower === '127.0.0.1' || lower === '0.0.0.0') return true;
  if (lower.startsWith('10.')) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(lower)) return true;
  if (lower.startsWith('192.168.')) return true;
  if (lower.startsWith('169.254.')) return true;
  return false;
}

/**
 * Returns true if an image URL is safe to render.
 *
 * Rules:
 * 1. Relative URLs are allowed (these point at our own storage/API).
 * 2. Only http/https protocols are accepted.
 * 3. Localhost and private IP hosts are rejected.
 * 4. Known thumbnail / proxy / low-resolution hosts are rejected.
 * 5. URLs ending in a common image file extension are accepted from any
 *    non-blocklisted public host (the path itself is the image file).
 * 6. URLs served by the explicit trusted-host allowlist are accepted even
 *    without a file extension.
 * 7. Everything else is rejected.
 *
 * This gives us a provider/allowlist model for unknown URLs while still
 * accepting direct image files from legitimate publisher domains.
 */
function isBlockedImageHost(hostname: string): boolean {
  return BLOCKED_IMAGE_HOSTS.has(hostname.toLowerCase());
}

export function hasBlockedImageHost(url: string): boolean {
  if (!url || url.startsWith('/') || url.startsWith('data:image/')) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  return isBlockedImageHost(parsed.hostname);
}

export function isTrustedImageUrl(url: string): boolean {
  if (!url) return false;

  if (url.startsWith('/')) {
    return true;
  }

  // Allow self-contained data URIs (used for user-uploaded images).
  if (url.startsWith('data:image/')) {
    return true;
  }

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

  if (isPrivateOrLocalhost(hostname)) {
    return false;
  }

  if (BLOCKED_IMAGE_HOSTS.has(hostname)) {
    return false;
  }

  if (TRUSTED_IMAGE_HOSTS.has(hostname)) {
    return true;
  }

  if (DIRECT_IMAGE_EXTENSION.test(parsed.pathname)) {
    return true;
  }

  return false;
}
