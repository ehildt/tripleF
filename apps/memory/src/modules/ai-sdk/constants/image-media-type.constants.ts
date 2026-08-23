import type {
  ImageMediaTypeSignatures,
  MediaTypeSignature,
} from './image-media-type.types.js';

export type { ImageMediaType } from './image-media-type.types.js';

export const MEDIA_TYPE = {
  JPEG: 'image/jpeg',
  PNG: 'image/png',
  WEBP: 'image/webp',
  GIF: 'image/gif',
} as const;

export const IMAGE_MEDIA_TYPE_SIGNATURES: ImageMediaTypeSignatures = {
  'image/png': [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/gif': [0x47, 0x49, 0x46, 0x38, null, 0x61],
  'image/webp': [
    0x52,
    0x49,
    0x46,
    0x46,
    null,
    null,
    null,
    null,
    0x57,
    0x45,
    0x42,
    0x50,
  ],
} as const satisfies ImageMediaTypeSignatures;

export function matchesMediaTypeSignature(
  buffer: Uint8Array,
  signature: MediaTypeSignature,
): boolean {
  if (buffer.length < signature.length) return false;

  return signature.every((byte, index) => {
    if (byte === null) return true;
    return buffer[index] === byte;
  });
}
