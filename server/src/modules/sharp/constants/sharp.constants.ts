import type { SharpOptions } from '../dtos/sharp-options.dto.js';

/**
 * Default preprocessing options
 */
const DEFAULT_PREPROCESSING_OPTIONS: Required<
  Pick<SharpOptions, 'enabled' | 'resize' | 'variants' | 'parameters'>
> = {
  enabled: true,
  resize: {
    maxWidth: 768,
    maxHeight: undefined,
    withoutEnlargement: true,
  },
  variants: {
    original: true,
    grayscale: false,
    denoised: false,
    sharpened: false,
    clahe: false,
  },
  parameters: {
    blurSigma: 0.5,
    sharpenSigma: 1,
    sharpenM1: 1,
    sharpenM2: 2,
    contrastLevel: 1.3,
    brightnessLevel: 1.2,
    claheWidth: 8,
    claheHeight: 8,
    claheMaxSlope: 3,
    normalizeLower: 1,
    normalizeUpper: 99,
  },
};

/**
 * Descriptions for each image variant
 * These explain to the AI what each variant shows
 */
export const VARIANT_DESCRIPTIONS: Record<string, string> = {
  original: 'original - baseline image at reduced resolution',
  grayscale:
    'grayscale - luminance only, removes color noise to focus on text structure',
  denoised:
    'denoised - background smoothed with Gaussian blur to reduce noise and artifacts',
  sharpened:
    'sharpened - edges enhanced for improved text clarity and boundary definition',
  clahe:
    'CLAHE - adaptive contrast enhancement that brings out details in both bright and dark areas',
};

/**
 * Merge user options with defaults
 */
export function mergeSharpOptions(
  userOptions?: SharpOptions,
  defaults: Required<SharpOptions> = DEFAULT_PREPROCESSING_OPTIONS,
): Required<SharpOptions> {
  if (!userOptions) {
    return defaults;
  }

  return {
    enabled: userOptions.enabled ?? defaults.enabled,
    resize: {
      ...defaults.resize,
      ...userOptions.resize,
    },
    variants: {
      ...defaults.variants,
      ...userOptions.variants,
    },
    parameters: {
      ...defaults.parameters,
      ...userOptions.parameters,
    },
  };
}
