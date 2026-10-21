import { onUnmounted, ref } from 'vue';

/** Window in which the second (confirming) click must happen. */
const DELETE_ARM_WINDOW_MS = 3000;

/**
 * Two-click arm state for destructive DLQ row actions: the first
 * `armOrConfirmDelete` call arms and starts a timeout that disarms
 * automatically; a second call within the window disarms and returns true,
 * signalling the action should execute. Deleting a DLQ entry is irreversible,
 * so a single click never executes.
 */
export function useDlqDeleteArm() {
  const isDeleteArmed = ref(false);
  let deleteArmTimer: ReturnType<typeof setTimeout> | null = null;

  function disarmDelete() {
    isDeleteArmed.value = false;
    if (deleteArmTimer) clearTimeout(deleteArmTimer);
    deleteArmTimer = null;
  }

  /** First call arms (returns false); a second call while armed returns true. */
  function armOrConfirmDelete(): boolean {
    if (isDeleteArmed.value) {
      disarmDelete();
      return true;
    }
    isDeleteArmed.value = true;
    deleteArmTimer = setTimeout(disarmDelete, DELETE_ARM_WINDOW_MS);
    return false;
  }

  onUnmounted(disarmDelete);

  return { isDeleteArmed, armOrConfirmDelete };
}
