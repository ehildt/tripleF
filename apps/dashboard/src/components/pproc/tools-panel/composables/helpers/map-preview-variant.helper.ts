import type { SharpPreviewVariant } from '../use-preprocessing-preview.types';

/** Project a preview variant into the lightbox image shape. */
export function mapPreviewVariant(v: SharpPreviewVariant) {
  return {
    url: v.dataUrl,
    title: `${v.variant} — ${v.description}`,
  };
}
