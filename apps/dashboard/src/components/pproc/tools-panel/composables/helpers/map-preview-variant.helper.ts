import type { LightboxImage } from '@/types/lightbox.model';

import type { SharpPreviewVariant } from '../use-preprocessing-preview.types';

/** Project a preview variant into the lightbox image shape. */
export function mapPreviewVariant(variant: SharpPreviewVariant): LightboxImage {
  return {
    url: variant.dataUrl,
    title: `${variant.variant} — ${variant.description}`,
  };
}
