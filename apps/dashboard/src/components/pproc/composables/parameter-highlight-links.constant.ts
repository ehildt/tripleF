/**
 * Cross-highlights between preprocessing variant tiles and the advanced
 * parameter tiles: hovering a variant highlights the parameters it drives,
 * hovering a parameter highlights the variants that read it (and vice versa).
 */
export const VARIANT_PARAMETERS: Record<string, string[]> = {
  original: [],
  grayscale: [],
  denoised: ['blurSigma'],
  sharpened: ['sharpenSigma', 'sharpenM1', 'sharpenM2'],
  clahe: [
    'claheWidth',
    'claheHeight',
    'claheMaxSlope',
    'brightnessLevel',
    'normalizeLower',
    'normalizeUpper',
  ],
};

export const PARAMETER_VARIANTS: Record<string, string[]> = {
  blurSigma: ['denoised'],
  sharpenSigma: ['sharpened'],
  sharpenM1: ['sharpened'],
  sharpenM2: ['sharpened'],
  claheWidth: ['clahe'],
  claheHeight: ['clahe'],
  claheMaxSlope: ['clahe'],
  brightnessLevel: ['clahe'],
  normalizeLower: ['clahe'],
  normalizeUpper: ['clahe'],
};
