import { saveConfig } from '@/api/config.api';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

/** Memory-space edits: update local data first, then retain the existing
 * best-effort server persistence and offline in-memory/localStorage behavior. */
export function useMemorySpaceSettings() {
  const memorySpacesStore = useMemorySpacesStore();

  function persistMemoryCognition(value: string): void {
    saveConfig(getPersistentSocketSessionId(), {
      memoryCognition: value,
    }).catch(() => {
      // Offline — the local value is kept; a later set retries.
    });
  }

  function setMemoryCognition(value: string): void {
    memorySpacesStore.setMemoryCognition(value);
    persistMemoryCognition(value.trim());
  }

  function removeMemoryCognitionSpace(space: string): void {
    const removedActiveSpace = memorySpacesStore.memoryCognition === space;
    memorySpacesStore.removeMemoryCognitionSpace(space);
    if (removedActiveSpace) persistMemoryCognition('');
  }

  return { setMemoryCognition, removeMemoryCognitionSpace };
}
