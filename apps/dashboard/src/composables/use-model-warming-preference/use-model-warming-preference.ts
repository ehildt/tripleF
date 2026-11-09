import { type Ref, ref } from 'vue';

import { loadBooleanSetting } from '@/utils/load-boolean-setting/load-boolean-setting.helper';
import { saveBooleanSetting } from '@/utils/save-boolean-setting/save-boolean-setting.helper';

const WARM_MODEL_ON_SELECT_KEY = 'harness-warm-model-on-select';

interface ModelWarmingPreference {
  warmModelOnSelect: Ref<boolean>;
  toggleWarmModelOnSelect: () => void;
}

const warmModelOnSelect = ref(
  loadBooleanSetting(WARM_MODEL_ON_SELECT_KEY, false),
);

/**
 * Own the singleton opt-in model-warming preference. Toggling writes through
 * the existing storage helpers, preserving tab-local state and denied-storage
 * fallback without a store watcher or application bootstrap side effect.
 */
export function useModelWarmingPreference(): ModelWarmingPreference {
  function toggleWarmModelOnSelect(): void {
    const value = !warmModelOnSelect.value;
    warmModelOnSelect.value = value;
    saveBooleanSetting(WARM_MODEL_ON_SELECT_KEY, value);
  }

  return { warmModelOnSelect, toggleWarmModelOnSelect };
}
