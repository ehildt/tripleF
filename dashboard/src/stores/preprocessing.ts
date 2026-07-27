import { useDebounceFn } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import { getPersistentSocketSessionId } from '@/stores/helpers/get-persistent-socket-session-id.helper';

const SESSION_ID = getPersistentSocketSessionId();

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
  original: 'Unmodified baseline image',
  grayscale: 'Best for text and structure',
  denoised: 'Reduces noise and artifacts',
  sharpened: 'Crisper text and boundaries',
  clahe: 'Reveals detail in shadows and highlights',
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
  // Single source-of-truth ref; loaded from global + session config on boot.
  const settings = ref<PreprocessingSettings>({
    ...DEFAULT_PREPROCESSING_SETTINGS,
  });

  function mergePartialSettings(
    patch?: Record<string, unknown> | null,
  ): PreprocessingSettings {
    if (!patch) return { ...DEFAULT_PREPROCESSING_SETTINGS };
    return {
      ...DEFAULT_PREPROCESSING_SETTINGS,
      ...patch,
      resize: {
        ...DEFAULT_PREPROCESSING_SETTINGS.resize,
        ...(patch.resize as Record<string, unknown>),
      },
      variants: {
        ...DEFAULT_PREPROCESSING_SETTINGS.variants,
        ...(patch.variants as Record<string, unknown>),
      },
      parameters: {
        ...DEFAULT_PREPROCESSING_SETTINGS.parameters,
        ...(patch.parameters as Record<string, unknown>),
      },
    } as PreprocessingSettings;
  }

  async function loadSettings() {
    try {
      const [globalRes, sessionConfig] = await Promise.all([
        fetch(getApiUrl('/api/v1/sharp-overrides')),
        fetchConfig(SESSION_ID),
      ]);
      const globalSettings = globalRes.ok
        ? ((await globalRes.json()) as Record<string, unknown>)
        : {};
      const merged = mergePartialSettings({
        ...globalSettings,
        ...sessionConfig?.preprocessing,
      });
      settings.value = merged;
    } catch {
      // Offline — keep the defaults.
    }
  }

  void loadSettings();

  /**
   * Server-side sync: preprocessing is applied by the server from its own
   * effective config (env defaults + overrides), so every settings change is
   * pushed as a global override. The same settings are also persisted as a
   * session override for cross-device recovery.
   */
  function pushSettingsToServer() {
    const body = JSON.stringify(settings.value);
    fetch(getApiUrl('/api/v1/sharp-overrides'), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body,
    }).catch(() => {
      /* offline — ignored */
    });
    saveConfig(SESSION_ID, { preprocessing: settings.value }).catch(() => {
      /* offline — ignored */
    });
  }

  const pushSettingsToServerDebounced = useDebounceFn(
    pushSettingsToServer,
    300,
  );

  watch(settings, () => pushSettingsToServerDebounced(), { deep: true });

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
    pushSettingsToServer,
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
  };
});
