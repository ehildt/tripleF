import type { FilePart } from '../types/ai-sdk-messages.types.js';

import { detectImageMimeType } from './detect-image-mime-type.helper.js';

function toBuffer(image: Uint8Array | string): Uint8Array {
  return typeof image === 'string' ? Buffer.from(image, 'base64') : image;
}

export function toFilePart(image: Uint8Array | string): FilePart {
  const data = toBuffer(image);
  return {
    type: 'file',
    data: Buffer.from(data).toString('base64'),
    mediaType: detectImageMimeType(data),
  };
}
