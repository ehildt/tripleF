import type { PreprocessingSize } from '../constants/image-preprocessing.constants.js';

export interface ImagePreprocessingOptions {
  /**
   * Master toggle for preprocessing
   * @default false
   */
  enabled?: boolean;

  /**
   * Resize options for all variants
   */
  resize?: {
    /**
     * Maximum width in pixels (allowed: 256, 384, 512, 640, 768, 1024)
     * @default 768
     */
    maxWidth?: PreprocessingSize;
    /**
     * Maximum height in pixels (keeps aspect ratio if only width specified)
     * @default null
     */
    maxHeight?: number | null;
    /**
     * Prevent enlarging images smaller than the target size
     * @default true
     */
    withoutEnlargement?: boolean;
  };

  /**
   * Toggle each image variant
   */
  variants?: {
    /**
     * Resized original image
     * @default true
     */
    original?: boolean;
    /**
     * Grayscale - removes color for luminance focus
     * @default true
     */
    grayscale?: boolean;
    /**
     * Denoised - Gaussian blur for background smoothing
     * @default true
     */
    denoised?: boolean;
    /**
     * Sharpened - edge enhancement for clarity
     * @default false
     */
    sharpened?: boolean;
    /**
     * CLAHE - adaptive contrast enhancement
     * @default true
     */
    clahe?: boolean;
  };

  /**
   * Processing parameters with defaults
   */
  parameters?: {
    /**
     * Gaussian blur sigma for denoising
     * @default 0.5
     */
    blurSigma?: number;
    /**
     * Sharpen sigma
     * @default 1
     */
    sharpenSigma?: number;
    /**
     * Sharpen flat area level
     * @default 1
     */
    sharpenM1?: number;
    /**
     * Sharpen jagged area level
     * @default 2
     */
    sharpenM2?: number;
    /**
     * Contrast multiplier
     * @default 1.3
     */
    contrastLevel?: number;
    /**
     * Brightness multiplier
     * @default 1.2
     */
    brightnessLevel?: number;
    /**
     * CLAHE tile width
     * @default 8
     */
    claheWidth?: number;
    /**
     * CLAHE tile height
     * @default 8
     */
    claheHeight?: number;
    /**
     * CLAHE max slope/contrast limit
     * @default 3
     */
    claheMaxSlope?: number;
    /**
     * Normalization lower percentile
     * @default 1
     */
    normalizeLower?: number;
    /**
     * Normalization upper percentile
     * @default 99
     */
    normalizeUpper?: number;
  };
}

/**
 * Result of preprocessing a single image
 */
export interface PreprocessedImage {
  /** The processed image buffer */
  buffer: Buffer;
  /** Metadata for the variant */
  meta: {
    name: string;
    type: string;
    hash: string;
    variant: string;
  };
  /** Variant identifier */
  variant: string;
  /** Description explaining the variant to AI */
  description: string;
}
