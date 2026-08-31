import type { PreprocessedImage } from '../../dtos/sharp-options.dto.js';
import type { SharpPreviewVariant } from '../sharp-preview.service.types.js';

/** Encode a preprocessed image into the preview variant shape. */
export function mapPreviewImage(image: PreprocessedImage): SharpPreviewVariant {
  return {
    variant: image.variant,
    name: image.meta.name,
    description: image.description,
    dataUrl: `data:${image.meta.type};base64,${image.buffer.toString('base64')}`,
  };
}
