import type {
  PreprocessingSettings,
  PreprocessingSize,
} from '@/types/preprocessing.model';

export const PREPROCESSING_SIZES: PreprocessingSize[] = [
  256, 384, 512, 640, 768, 1024,
];

export const DEFAULT_PREPROCESSING_SETTINGS: PreprocessingSettings = {
  enabled: true,
  resize: {
    maxWidth: 768,
    maxHeight: null,
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
    brightnessLevel: 1.2,
    claheWidth: 8,
    claheHeight: 8,
    claheMaxSlope: 3,
    normalizeLower: 1,
    normalizeUpper: 99,
  },
};

export const VARIANT_DESCRIPTIONS: Record<string, string> = {
  original: 'Unmodified baseline image',
  grayscale: 'Best for text and structure',
  denoised: 'Reduces noise and artifacts',
  sharpened: 'Crisper text and boundaries',
  clahe: 'Reveals detail in shadows and highlights',
};
