import type { PreprocessingSettings } from '@/types/preprocessing.model';

/** Clone every nested settings group so stores and queued writes share no mutable references. */
export function clonePreprocessingSettings(
  settings: PreprocessingSettings,
): PreprocessingSettings {
  return {
    enabled: settings.enabled,
    resize: { ...settings.resize },
    variants: { ...settings.variants },
    parameters: { ...settings.parameters },
  };
}
