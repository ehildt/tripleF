import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type {
  PreprocessingParametersOptions,
  PreprocessingResizeOptions,
  PreprocessingSettings,
  PreprocessingSize,
  PreprocessingVariantsOptions,
} from '@/types/preprocessing.model';

import { clonePreprocessingSettings } from './helpers/clone-preprocessing-settings.helper';
import { DEFAULT_PREPROCESSING_SETTINGS } from './preprocessing-settings.constant';

export const usePreprocessingSettingsStore = defineStore(
  'preprocessing',
  () => {
    const settings = ref<PreprocessingSettings>(
      clonePreprocessingSettings(DEFAULT_PREPROCESSING_SETTINGS),
    );

    const enabled = computed({
      get: () => settings.value.enabled,
      set: (value: boolean) => {
        settings.value.enabled = value;
      },
    });

    const resize = computed({
      get: () => settings.value.resize,
      set: (value: PreprocessingResizeOptions) => {
        settings.value.resize = value;
      },
    });

    const variants = computed({
      get: () => settings.value.variants,
      set: (value: PreprocessingVariantsOptions) => {
        settings.value.variants = value;
      },
    });

    const parameters = computed({
      get: () => settings.value.parameters,
      set: (value: PreprocessingParametersOptions) => {
        settings.value.parameters = value;
      },
    });

    function applySettings(value: PreprocessingSettings): void {
      settings.value = clonePreprocessingSettings(value);
    }

    function setEnabled(value: boolean): void {
      enabled.value = value;
    }

    function setMaxWidth(value: PreprocessingSize): void {
      resize.value = { ...resize.value, maxWidth: value };
    }

    function setMaxHeight(value: number | null): void {
      resize.value = { ...resize.value, maxHeight: value };
    }

    function setWithoutEnlargement(value: boolean): void {
      resize.value = { ...resize.value, withoutEnlargement: value };
    }

    function setVariant(
      variant: keyof PreprocessingVariantsOptions,
      value: boolean,
    ): void {
      variants.value = { ...variants.value, [variant]: value };
    }

    function setParameter(
      param: keyof PreprocessingParametersOptions,
      value: number,
    ): void {
      parameters.value = { ...parameters.value, [param]: value };
    }

    function resetToDefaults(): void {
      applySettings(DEFAULT_PREPROCESSING_SETTINGS);
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
      applySettings,
      setEnabled,
      setMaxWidth,
      setMaxHeight,
      setWithoutEnlargement,
      setVariant,
      setParameter,
      resetToDefaults,
      isParameterModified,
    };
  },
);
