import { computed, type ComputedRef, ref } from 'vue';

const dlqActivity = ref(false);
const hasDlqActivity = computed(() => dlqActivity.value);

interface DlqActivity {
  hasDlqActivity: ComputedRef<boolean>;
  markDlqActivity: () => void;
  clearDlqActivity: () => void;
}

/**
 * Controls the singleton DLQ attention indicator shared by the app navigation,
 * live-event coordinator, and DLQ view. Module scope preserves it across routes.
 */
export function useDlqActivity(): DlqActivity {
  function markDlqActivity(): void {
    dlqActivity.value = true;
  }

  function clearDlqActivity(): void {
    dlqActivity.value = false;
  }

  return { hasDlqActivity, markDlqActivity, clearDlqActivity };
}
