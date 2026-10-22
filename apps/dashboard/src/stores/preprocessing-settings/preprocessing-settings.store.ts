import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import { getApiUrl } from '@/api/api-url';
import { fetchConfig, saveConfig } from '@/api/config.api';
import type {
  PreprocessingParametersOptions,
  PreprocessingResizeOptions,
  PreprocessingSettings,
  PreprocessingSize,
  PreprocessingVariantsOptions,
} from '@/types/preprocessing.model';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

import { DEFAULT_PREPROCESSING_SETTINGS } from './preprocessing-settings.constant';

const SESSION_ID = getPersistentSocketSessionId();

export const usePreprocessingSettingsStore = defineStore(
  'preprocessing',
  () => {
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
      } finally {
        isLoadingSettings = false;
      }
    }

    void loadSettings();

    /**
     * Server-side sync: preprocessing is applied by the server from its own
     * effective config (env defaults + overrides), so every settings change is
     * pushed immediately — as the sharp-overrides override AND as the
     * session-scoped config that the next load fetches back. Skipped while the
     * persisted config is being loaded: applying server state must not echo
     * another write.
     */
    let isLoadingSettings = true;
    function pushSettingsToServer() {
      if (isLoadingSettings) return;
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

    watch(settings, () => pushSettingsToServer(), { deep: true });

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
      resetParameter,
      isParameterModified,
    };
  },
);
