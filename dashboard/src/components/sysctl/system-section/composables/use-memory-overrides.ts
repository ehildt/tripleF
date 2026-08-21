import { onMounted, ref } from 'vue';

import {
  fetchMemoryOverrides,
  updateMemoryOverrides,
} from '@/api/memory-overrides.api';

/**
 * The memory system variables (sysctl → system): server-side global settings
 * layered over env defaults (currently the cognition profile character cap).
 * Reads on mount; a write takes effect on the very next request without a
 * restart. Fetch failures leave the field empty — SysCtl stays usable when
 * memory is off.
 */
export function useMemoryOverrides() {
  const cognitionLimit = ref<number | undefined>(undefined);
  const isLoading = ref(false);

  async function loadOverrides() {
    isLoading.value = true;
    try {
      cognitionLimit.value = (await fetchMemoryOverrides()).cognitionLimit;
    } catch {
      cognitionLimit.value = undefined;
    } finally {
      isLoading.value = false;
    }
  }

  async function saveCognitionLimit(value: number) {
    cognitionLimit.value = value;
    try {
      await updateMemoryOverrides({ cognitionLimit: value });
    } catch {
      // Offline or validation rejection — reload restores the true value.
      await loadOverrides();
    }
  }

  onMounted(loadOverrides);

  return { cognitionLimit, isLoading, saveCognitionLimit };
}
