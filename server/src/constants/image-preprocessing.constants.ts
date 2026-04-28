import type { ImagePreprocessingOptions } from '../dtos/image-preprocessing-options.dto.js';

/**
 * Allowed preprocessing sizes
 */
export type PreprocessingSize = 1024 | 768 | 640 | 512 | 384 | 256;

/**
 * Enum array of allowed preprocessing sizes for Swagger/documentation
 */
export const PREPROCESSING_SIZES: PreprocessingSize[] = [
  1024, 768, 640, 512, 384, 256,
];

/**
 * Default preprocessing options
 */
const DEFAULT_PREPROCESSING_OPTIONS: Required<
  Pick<
    ImagePreprocessingOptions,
    'enabled' | 'resize' | 'variants' | 'parameters'
  >
> = {
  enabled: false,
  resize: {
    maxWidth: 768,
    maxHeight: undefined,
    withoutEnlargement: true,
  },
  variants: {
    original: true,
    grayscale: true,
    denoised: true,
    sharpened: false,
    clahe: true,
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
export function mergePreprocessingOptions(
  userOptions?: ImagePreprocessingOptions,
): Required<ImagePreprocessingOptions> {
  if (!userOptions) {
    return DEFAULT_PREPROCESSING_OPTIONS;
  }

  return {
    enabled: userOptions.enabled ?? DEFAULT_PREPROCESSING_OPTIONS.enabled,
    resize: {
      ...DEFAULT_PREPROCESSING_OPTIONS.resize,
      ...userOptions.resize,
    },
    variants: {
      ...DEFAULT_PREPROCESSING_OPTIONS.variants,
      ...userOptions.variants,
    },
    parameters: {
      ...DEFAULT_PREPROCESSING_OPTIONS.parameters,
      ...userOptions.parameters,
    },
  };
}
