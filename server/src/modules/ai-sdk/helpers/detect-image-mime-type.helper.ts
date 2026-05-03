import {
  IMAGE_MEDIA_TYPE_SIGNATURES,
  type ImageMediaType,
  matchesMediaTypeSignature,
  MEDIA_TYPE,
} from '../constants/image-media-type.constants.js';

export class UnsupportedImageFormatError extends Error {
  constructor() {
    super('Unsupported image format');
  }
}

function isMediaType(buffer: Uint8Array, mediaType: ImageMediaType): boolean {
  return matchesMediaTypeSignature(
    buffer,
    IMAGE_MEDIA_TYPE_SIGNATURES[mediaType],
  );
}

export function detectImageMimeType(buffer: Uint8Array): ImageMediaType {
  if (isMediaType(buffer, MEDIA_TYPE.PNG)) return MEDIA_TYPE.PNG;
  if (isMediaType(buffer, MEDIA_TYPE.WEBP)) return MEDIA_TYPE.WEBP;
  if (isMediaType(buffer, MEDIA_TYPE.GIF)) return MEDIA_TYPE.GIF;
  if (isMediaType(buffer, MEDIA_TYPE.JPEG)) return MEDIA_TYPE.JPEG;

  throw new UnsupportedImageFormatError();
}
