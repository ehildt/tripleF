import { Sharp } from 'sharp';

import { FastifyMultipartMeta } from '../../harness/dtos/harness-job.dto.js';
import { VARIANT_DESCRIPTIONS } from '../constants/sharp.constants.js';
import { PreprocessedImage, SharpOptions } from '../dtos/sharp-options.dto.js';

export type Variant =
  'original' | 'grayscale' | 'denoised' | 'sharpened' | 'clahe';

export type FilterVariant = Exclude<Variant, 'original'>;

export type VariantPipeline = (pipeline: Sharp) => Sharp;

/**
 * Returns the list of variant keys that are enabled.
 */
export function getEnabledVariants(
  variantOptions: Required<SharpOptions>['variants'],
): Variant[] {
  return (Object.keys(variantOptions) as Variant[]).filter(
    (variant) => variantOptions[variant],
  );
}

/**
 * Returns the sharp pipeline transformer for a given variant.
 */
export function getVariantPipeline(
  variant: Variant,
  parameters: Required<SharpOptions>['parameters'],
): VariantPipeline {
  switch (variant) {
    case 'original':
      return (pipeline) => pipeline;
    case 'grayscale':
      return (pipeline) => pipeline.grayscale();
    case 'denoised':
      return (pipeline) => pipeline.blur(parameters.blurSigma);
    case 'sharpened':
      return (pipeline) =>
        pipeline.sharpen({
          sigma: parameters.sharpenSigma ?? 1,
          m1: parameters.sharpenM1 ?? 1,
          m2: parameters.sharpenM2 ?? 2,
        });
    case 'clahe':
      return (pipeline) =>
        pipeline.grayscale().clahe({
          width: parameters.claheWidth ?? 8,
          height: parameters.claheHeight ?? 8,
          maxSlope: parameters.claheMaxSlope ?? 3,
        });
    default:
      return (pipeline) => pipeline;
  }
}

/**
 * Build metadata for a preprocessed image variant.
 */
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

/**
 * Get the human-readable description for a variant.
 */
export function getVariantDescription(variant: Variant): string {
  return VARIANT_DESCRIPTIONS[variant] ?? variant;
}
