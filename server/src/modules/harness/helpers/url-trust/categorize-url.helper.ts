import type { UrlKind } from './categorize-url.helper.types.js';
import { isEmbeddableVideoUrl } from './is-embeddable-video-url.helper.js';
import { isTrustedImageUrl } from './is-trusted-image-url.helper.js';
import { isTrustedUrl } from './is-trusted-url.helper.js';

/** Categorizes a URL for the sanitization step. */
export function categorizeUrl(url: string): {
  kind: UrlKind;
  trusted: boolean;
} {
  if (!url) return { kind: 'untrusted', trusted: false };

  // Relative storage URLs and data URIs are handled by image helpers.
  if (url.startsWith('/') || url.startsWith('data:image/')) {
    return { kind: 'image', trusted: true };
  }

  if (isTrustedImageUrl(url)) return { kind: 'image', trusted: true };
  if (isEmbeddableVideoUrl(url)) return { kind: 'video', trusted: true };
  if (isTrustedUrl(url)) return { kind: 'page', trusted: true };

  return { kind: 'untrusted', trusted: false };
}
