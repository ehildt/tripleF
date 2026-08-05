import {
  HTML_CONTENT_TYPE_PREFIXES,
  IMAGE_CONTENT_TYPE_PREFIXES,
  VIDEO_CONTENT_TYPE_PREFIXES,
} from './media-type.constants.js';

export type MediaUrlKind = 'image' | 'video' | 'html' | 'broken' | 'unknown';

/** Classify a URL's kind from its response content-type. */
export function classifyByContentType(contentType?: string): MediaUrlKind {
  if (!contentType) return 'unknown';

  if (IMAGE_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
    return 'image';
  if (VIDEO_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
    return 'video';
  if (HTML_CONTENT_TYPE_PREFIXES.some((p) => contentType.startsWith(p)))
    return 'html';

  return 'unknown';
}
