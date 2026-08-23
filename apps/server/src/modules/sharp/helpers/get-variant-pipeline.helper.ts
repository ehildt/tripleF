import type { Sharp } from 'sharp';

import type { SharpOptions } from '../dtos/sharp-options.dto.js';
import { Variant } from '../types/image-variant.types.js';

/** Returns the sharp pipeline transformer for a given variant. */
export function getVariantPipeline(
  variant: Variant,
  parameters: Required<SharpOptions>['parameters'],
): (pipeline: Sharp) => Sharp {
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
