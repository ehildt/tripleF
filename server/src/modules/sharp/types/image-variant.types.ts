import type { Sharp } from 'sharp';

/** Variant keys for image preprocessing. */
export type Variant =
  'original' | 'grayscale' | 'denoised' | 'sharpened' | 'clahe';

/** Filter variants exclude the original passthrough variant. */
export type FilterVariant = Exclude<Variant, 'original'>;

/** Sharp pipeline transformer function signature. */
export type VariantPipeline = (pipeline: Sharp) => Sharp;
