import { IMAGE_CONTENT_TYPE_PREFIXES } from './media-type.constants.js';

/** True when the content-type indicates an image. */
export function isImageContentType(contentType?: string): boolean {
  if (!contentType) return false;
  return IMAGE_CONTENT_TYPE_PREFIXES.some((p) =>
    contentType.toLowerCase().startsWith(p),
  );
}
