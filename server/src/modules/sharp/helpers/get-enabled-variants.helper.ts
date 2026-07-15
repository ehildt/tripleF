import type { SharpOptions } from '../dtos/sharp-options.dto.js';
import { Variant } from '../types/image-variant.types.js';

/** Returns the list of variant keys that are enabled. */
export function getEnabledVariants(
  variantOptions: Required<SharpOptions>['variants'],
): Variant[] {
  return (Object.keys(variantOptions) as Variant[]).filter(
    (variant) => variantOptions[variant],
  );
}
