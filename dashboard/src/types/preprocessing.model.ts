export type PreprocessingSize = 256 | 384 | 512 | 640 | 768 | 1024;

export interface PreprocessingResizeOptions {
  maxWidth: PreprocessingSize;
  maxHeight: number | null;
  withoutEnlargement: boolean;
}

export interface PreprocessingVariantsOptions {
  original: boolean;
  grayscale: boolean;
  denoised: boolean;
  sharpened: boolean;
  clahe: boolean;
}

export interface PreprocessingParametersOptions {
  blurSigma: number;
  sharpenSigma: number;
  sharpenM1: number;
  sharpenM2: number;
  brightnessLevel: number;
  claheWidth: number;
  claheHeight: number;
  claheMaxSlope: number;
  normalizeLower: number;
  normalizeUpper: number;
}

export interface PreprocessingSettings {
  enabled: boolean;
  resize: PreprocessingResizeOptions;
  variants: PreprocessingVariantsOptions;
  parameters: PreprocessingParametersOptions;
}
