export type PreprocessingSize = 256 | 384 | 512 | 640 | 768 | 1024;

export interface PreprocessingResizeOptions {
  /** Maximum output width selected from the supported sharp sizes. */
  maxWidth: PreprocessingSize;
  /** Optional maximum output height; null preserves the unconstrained height. */
  maxHeight: number | null;
  /** Whether images smaller than the requested dimensions remain unenlarged. */
  withoutEnlargement: boolean;
}

export interface PreprocessingVariantsOptions {
  /** Whether to include the unmodified baseline image. */
  original: boolean;
  /** Whether to include the grayscale variant. */
  grayscale: boolean;
  /** Whether to include the denoised variant. */
  denoised: boolean;
  /** Whether to include the sharpened variant. */
  sharpened: boolean;
  /** Whether to include the contrast-limited adaptive histogram variant. */
  clahe: boolean;
}

export interface PreprocessingParametersOptions {
  /** Gaussian blur sigma used by the denoise operation. */
  blurSigma: number;
  /** Sharpening radius. */
  sharpenSigma: number;
  /** Sharpening flat-region multiplier. */
  sharpenM1: number;
  /** Sharpening edge multiplier. */
  sharpenM2: number;
  /** Brightness multiplier applied by the brightness operation. */
  brightnessLevel: number;
  /** Horizontal CLAHE tile-grid width. */
  claheWidth: number;
  /** Vertical CLAHE tile-grid height. */
  claheHeight: number;
  /** Maximum CLAHE contrast slope. */
  claheMaxSlope: number;
  /** Lower normalization percentile. */
  normalizeLower: number;
  /** Upper normalization percentile. */
  normalizeUpper: number;
}

export interface PreprocessingSettings {
  /** Master switch for server-side preprocessing. */
  enabled: boolean;
  /** Output resize constraints. */
  resize: PreprocessingResizeOptions;
  /** Image variants requested from the sharp pipeline. */
  variants: PreprocessingVariantsOptions;
  /** Numeric parameters used by the enabled image operations. */
  parameters: PreprocessingParametersOptions;
}
