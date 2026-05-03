import { useStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

export type PreprocessingSize = 256 | 384 | 512 | 640 | 768 | 1024;

interface PreprocessingResizeOptions {
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
  original: 'Baseline image at reduced resolution',
  grayscale: 'Luminance only, removes color noise to focus on text structure',
  denoised:
    'Background smoothed with Gaussian blur to reduce noise and artifacts',
  sharpened: 'Edges enhanced for improved text clarity and boundary definition',
  clahe:
    'Adaptive contrast enhancement that brings out details in both bright and dark areas',
};

const VARIANT_PARAMETERS: Record<string, string[]> = {
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

const PARAMETER_VARIANTS: Record<string, string[]> = {
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

export const usePreprocessingStore = defineStore('preprocessing', () => {
  // Single source-of-truth ref synced to localStorage
  const settings = useStorage<PreprocessingSettings>(
    'preprocessing-settings',
    { ...DEFAULT_PREPROCESSING_SETTINGS },
    localStorage,
    { mergeDefaults: true },
  );

  // Convenience refs — same refs exposed before, now backed by settings
  const enabled = computed({
    get: () => settings.value.enabled,
    set: (v: boolean) => {
      settings.value.enabled = v;
    },
  });

  const resize = computed({
    get: () => settings.value.resize,
    set: (v: PreprocessingResizeOptions) => {
      settings.value.resize = v;
    },
  });

  const variants = computed({
    get: () => settings.value.variants,
    set: (v: PreprocessingVariantsOptions) => {
      settings.value.variants = v;
    },
  });

  const parameters = computed({
    get: () => settings.value.parameters,
    set: (v: PreprocessingParametersOptions) => {
      settings.value.parameters = v;
    },
  });

  const isEffectivelyEnabled = computed(() => {
    if (!enabled.value) return false;
    return Object.values(variants.value).some((v) => v === true);
  });

  function setEnabled(value: boolean) {
    enabled.value = value;
  }

  function setMaxWidth(value: PreprocessingSize) {
    resize.value = { ...resize.value, maxWidth: value };
  }

  function setMaxHeight(value: number | null) {
    resize.value = { ...resize.value, maxHeight: value };
  }

  function setWithoutEnlargement(value: boolean) {
    resize.value = { ...resize.value, withoutEnlargement: value };
  }

  function setVariant(
    variant: keyof PreprocessingVariantsOptions,
    value: boolean,
  ) {
    variants.value = { ...variants.value, [variant]: value };
  }

  // Hover state for variant tiles
  const hoveredVariant = ref<keyof PreprocessingVariantsOptions | null>(null);

  function setHoveredVariant(
    variant: keyof PreprocessingVariantsOptions | null,
  ) {
    hoveredVariant.value = variant;
  }

  const highlightedParameters = computed(() => {
    if (!hoveredVariant.value) return [];
    return VARIANT_PARAMETERS[hoveredVariant.value] ?? [];
  });

  function isParameterHighlighted(paramKey: string): boolean {
    return highlightedParameters.value.includes(paramKey);
  }

  // Hover state for parameter tiles
  const hoveredParameter = ref<keyof PreprocessingParametersOptions | null>(
    null,
  );

  function setHoveredParameter(
    param: keyof PreprocessingParametersOptions | null,
  ) {
    hoveredParameter.value = param;
  }

  const highlightedVariants = computed(() => {
    if (!hoveredParameter.value) return [];
    return PARAMETER_VARIANTS[hoveredParameter.value] ?? [];
  });

  function isVariantHighlighted(variantKey: string): boolean {
    return highlightedVariants.value.includes(variantKey);
  }

  function setParameter(
    param: keyof PreprocessingParametersOptions,
    value: number,
  ) {
    parameters.value = { ...parameters.value, [param]: value };
  }

  function resetToDefaults() {
    settings.value = {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      resize: { ...DEFAULT_PREPROCESSING_SETTINGS.resize },
      variants: {
        original: true,
        grayscale: false,
        denoised: false,
        sharpened: false,
        clahe: false,
      },
      parameters: { ...DEFAULT_PREPROCESSING_SETTINGS.parameters },
    };
  }

  function resetParametersToDefaults() {
    parameters.value = { ...DEFAULT_PREPROCESSING_SETTINGS.parameters };
  }

  function buildQueryParams(): Record<string, string | undefined> {
    if (!enabled.value) return {};

    const params: Record<string, string | undefined> = {
      pproc_enabled: 'true',
      pproc_original: variants.value.original ? 'true' : 'false',
      pproc_grayscale: variants.value.grayscale ? 'true' : 'false',
      pproc_denoised: variants.value.denoised ? 'true' : 'false',
      pproc_sharpened: variants.value.sharpened ? 'true' : 'false',
      pproc_clahe: variants.value.clahe ? 'true' : 'false',
      pproc_resize_maxWidth: resize.value.maxWidth.toString(),
      pproc_resize_maxHeight: resize.value.maxHeight?.toString(),
      pproc_resize_withoutEnlargement: resize.value.withoutEnlargement
        ? 'true'
        : 'false',
      pproc_blurSigma: parameters.value.blurSigma.toString(),
      pproc_sharpenSigma: parameters.value.sharpenSigma.toString(),
      pproc_sharpenM1: parameters.value.sharpenM1.toString(),
      pproc_sharpenM2: parameters.value.sharpenM2.toString(),
      pproc_brightnessLevel: parameters.value.brightnessLevel.toString(),
      pproc_claheWidth: parameters.value.claheWidth.toString(),
      pproc_claheHeight: parameters.value.claheHeight.toString(),
      pproc_claheMaxSlope: parameters.value.claheMaxSlope.toString(),
      pproc_normalizeLower: parameters.value.normalizeLower.toString(),
      pproc_normalizeUpper: parameters.value.normalizeUpper.toString(),
    };

    Object.keys(params).forEach((key) => {
      if (params[key] === undefined) {
        delete params[key];
      }
    });

    return params;
  }

  function getSummary(): string {
    if (!enabled.value) return 'Disabled';
    const activeVariants = Object.entries(variants.value)
      .filter(([, v]) => v)
      .map(([k]) => k);
    return `${resize.value.maxWidth}px | ${activeVariants.join(', ')}`;
  }

  function resetParameter(param: keyof PreprocessingParametersOptions) {
    parameters.value = {
      ...parameters.value,
      [param]: DEFAULT_PREPROCESSING_SETTINGS.parameters[param],
    };
  }

  function isParameterModified(
    param: keyof PreprocessingParametersOptions,
  ): boolean {
    return (
      parameters.value[param] !==
      DEFAULT_PREPROCESSING_SETTINGS.parameters[param]
    );
  }

  const hasAnyParameterModified = computed(() => {
    return (
      Object.keys(parameters.value) as Array<
        keyof PreprocessingParametersOptions
      >
    ).some(
      (key) =>
        parameters.value[key] !==
        DEFAULT_PREPROCESSING_SETTINGS.parameters[key],
    );
  });

  return {
    enabled,
    resize,
    variants,
    parameters,
    settings,
    isEffectivelyEnabled,
    setEnabled,
    setMaxWidth,
    setMaxHeight,
    setWithoutEnlargement,
    setVariant,
    setParameter,
    resetToDefaults,
    buildQueryParams,
    getSummary,
    hoveredVariant,
    highlightedParameters,
    setHoveredVariant,
    isParameterHighlighted,
    hoveredParameter,
    highlightedVariants,
    setHoveredParameter,
    isVariantHighlighted,
    resetParameter,
    isParameterModified,
    hasAnyParameterModified,
    resetParametersToDefaults,
  };
});
