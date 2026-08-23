import { computed, ref, watch } from 'vue';

import { clampSysctlResults } from '../../../helpers/clamp-sysctl-results.helper';
import type {
  SourcesPanelPatch,
  SourcesPanelProps,
} from '../SourcesPanel.types';

export const MAX_IMAGE_TASK_REFERENCE_COUNT = 50;
export const DEFAULT_IMAGE_TASK_REFERENCE_COUNT = 6;

/**
 * Owns the SourcesPanel's patch wiring: the image-task reference pool size
 * (checkbox off ⇔ 0, re-enable restores the last non-zero size; the number
 * input is clamped to 1..50) and the mapping of a source-list card's parsed
 * list onto its config key.
 */
export function useSourcesPanel(
  props: SourcesPanelProps,
  emit: (event: 'patch', payload: SourcesPanelPatch) => void,
) {
  /** Reference pool size shown in the number field (0 when disabled). */
  const referenceCount = computed(
    () =>
      props.sources?.imageTaskReferenceCount ??
      DEFAULT_IMAGE_TASK_REFERENCE_COUNT,
  );
  const referenceCountEnabled = computed(() => referenceCount.value > 0);
  /** Last non-zero pool size, restored when the checkbox is re-enabled. */
  const lastEnabledCount = ref(DEFAULT_IMAGE_TASK_REFERENCE_COUNT);

  watch(
    () => props.sources?.imageTaskReferenceCount,
    (count) => {
      if (count != null && count > 0) lastEnabledCount.value = count;
    },
    { immediate: true },
  );

  /** Commit the image-task reference pool size, clamped to 1..50. */
  function saveReferenceCount(value: number) {
    const clamped = clampSysctlResults(value, MAX_IMAGE_TASK_REFERENCE_COUNT);
    emit('patch', { key: 'imageTaskReferenceCount', value: clamped });
  }

  /** Checkbox off ⇔ pool size 0 ("no reference images verified"); on restores
   *  the last non-zero size (always ≥ 1). */
  function toggleReferenceCount() {
    const next = referenceCountEnabled.value ? 0 : lastEnabledCount.value;
    emit('patch', { key: 'imageTaskReferenceCount', value: next });
  }

  /** Map a source-list card's parsed list onto its config key. */
  function handleListChange(key: 'preferred' | 'blocked', list: string[]) {
    emit('patch', { key, value: list });
  }

  return {
    referenceCount,
    referenceCountEnabled,
    saveReferenceCount,
    toggleReferenceCount,
    handleListChange,
  };
}
