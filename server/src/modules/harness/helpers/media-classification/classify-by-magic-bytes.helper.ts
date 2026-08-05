import { bufferStartsWith } from './buffer-starts-with.helper.js';
import type { MediaUrlKind } from './classify-by-content-type.helper.js';
import {
  IMAGE_MAGIC_BYTES,
  ISOBMFF_IMAGE_BRANDS,
  VIDEO_MAGIC_BYTES,
} from './media-type.constants.js';

/** Classify a buffer's media kind by inspecting its leading magic bytes. */
export function classifyByMagicBytes(buffer: Buffer): MediaUrlKind {
  // WebP is a RIFF container with "WEBP" at bytes 8-11.
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return 'image';
  }

  // ISOBMFF containers start with a 4-byte size then "ftyp" at offset 4.
  // The major brand at offset 8 distinguishes videos (mp4, isom, …) from
  // AVIF/HEIF images, which share the same container format.
  if (
    buffer.length >= 8 &&
    buffer[4] === 0x66 &&
    buffer[5] === 0x74 &&
    buffer[6] === 0x79 &&
    buffer[7] === 0x70
  ) {
    if (buffer.length >= 12) {
      const brand = buffer.toString('ascii', 8, 12);
      if (ISOBMFF_IMAGE_BRANDS.has(brand)) return 'image';
    }
    return 'video';
  }

  for (const signature of IMAGE_MAGIC_BYTES) {
    if (bufferStartsWith(buffer, signature.bytes)) return 'image';
  }
  for (const signature of VIDEO_MAGIC_BYTES) {
    if (bufferStartsWith(buffer, signature.bytes)) return 'video';
  }
  return 'unknown';
}
