import type { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import type { PreprocessedImage } from '../dtos/sharp-options.dto.js';
import type { Variant } from '../types/image-variant.types.js';

/** Build metadata for a preprocessed image variant. */
export function buildVariantMeta(
  meta: FastifyMultipartMeta,
  variant: Variant,
): PreprocessedImage['meta'] {
  const lastDotIndex = meta.name.lastIndexOf('.');
  const hasExtension = lastDotIndex > 0;
  const baseName = hasExtension ? meta.name.slice(0, lastDotIndex) : meta.name;
  const fileExt = hasExtension ? meta.name.slice(lastDotIndex + 1) : 'png';

  return {
    name: `${baseName}_${variant}.${fileExt}`,
    type: meta.type,
    hash: `${meta.hash}_${variant}`,
    variant,
  };
}
