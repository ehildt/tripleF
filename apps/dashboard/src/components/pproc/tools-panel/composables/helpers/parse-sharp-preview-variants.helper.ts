import type { SharpPreviewVariant } from '../use-preprocessing-preview.types';

function isSharpPreviewVariant(value: unknown): value is SharpPreviewVariant {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.variant === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.description === 'string' &&
    typeof candidate.dataUrl === 'string'
  );
}

/** Validate the preview endpoint payload before projecting it into lightbox images. */
export function parseSharpPreviewVariants(
  payload: unknown,
): SharpPreviewVariant[] {
  if (!Array.isArray(payload) || !payload.every(isSharpPreviewVariant)) {
    throw new Error('Invalid preprocessing preview response');
  }
  return payload;
}
