import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

import { fetchConfig, saveConfig } from '@/api/config.api';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';
import { getPersistentSocketSessionId } from '@/utils/get-persistent-socket-session-id/get-persistent-socket-session-id.helper';

/** In-flight memory-space sync shared by every mounted memory surface. */
let memorySpaceSyncInFlight: Promise<void> | null = null;
/** Controller for the shared in-flight sync. */
let memorySpaceSyncAbort: AbortController | null = null;

/** Adopt server-persisted ids, push back ids the server lacks, and dedupe
 * concurrent surfaces into one request. */
function syncMemorySpacesFromServer(): Promise<void> {
  if (memorySpaceSyncInFlight) return memorySpaceSyncInFlight;

  const memorySpacesStore = useMemorySpacesStore();
  const controller = new AbortController();
  memorySpaceSyncAbort = controller;

  const run = (async () => {
    try {
      const config = await fetchConfig(
        getPersistentSocketSessionId(),
        controller.signal,
      );
      const pushBack: {
        memoryPartition?: string | null;
        memoryCognition?: string | null;
      } = {};

      if (config?.memoryPartition) {
        memorySpacesStore.adoptMemorySpaces({
          memoryPartition: config.memoryPartition,
        });
      } else {
        pushBack.memoryPartition = memorySpacesStore.memoryPartition;
      }
      if (config?.memoryCognition) {
        memorySpacesStore.adoptMemorySpaces({
          memoryCognition: config.memoryCognition,
        });
      } else {
        pushBack.memoryCognition = memorySpacesStore.memoryCognition;
      }

      if (
        pushBack.memoryPartition !== undefined ||
        pushBack.memoryCognition !== undefined
      ) {
        await saveConfig(getPersistentSocketSessionId(), pushBack);
      }
    } catch {
      if (controller.signal.aborted) return;
      // Offline or transient — keep local values; the next sync retries.
    } finally {
      // Only clear if this run is still the current one — a cancel may
      // have already been superseded by a fresh sync.
      if (memorySpaceSyncAbort === controller) {
        memorySpaceSyncAbort = null;
        memorySpaceSyncInFlight = null;
      }
    }
  })();

  memorySpaceSyncInFlight = run;
  return run;
}

/** Abort synchronously so a reopened surface can start a fresh request. */
function cancelMemorySpaceSync(): void {
  if (!memorySpaceSyncAbort) return;
  const controller = memorySpaceSyncAbort;
  memorySpaceSyncAbort = null;
  memorySpaceSyncInFlight = null;
  controller.abort();
}

/**
 * Sync the server-persisted memory ids while a memory surface is open, and
 * abort the in-flight sync when the surface is left. Shared by two consumers
 * with different lifecycles:
 *
 * - the Memory tab (kept alive): onActivated/onDeactivated fire on every
 *   tab switch, so the sync runs while the tab is open and is torn down on
 *   the way back to chat;
 * - the Settings memory section (not kept alive): only onMounted/onUnmounted
 *   fire, so it syncs once per visit.
 *
 * All four hooks are registered because no single pair covers both
 * lifecycles, and a kept-alive component fires both `mounted` and `activated`
 * on its first mount (and both `deactivated` and `unmounted` when torn down
 * while active). The local `syncActive` guard collapses those overlaps so the
 * shared sync sees exactly one start per open and one cancel per close.
 */
export function useMemorySpaceSync(): void {
  let syncActive = false;

  function startMemorySpaceSync(): void {
    if (syncActive) return;
    syncActive = true;
    void syncMemorySpacesFromServer();
  }

  function stopMemorySpaceSync(): void {
    if (!syncActive) return;
    syncActive = false;
    cancelMemorySpaceSync();
  }

  onMounted(startMemorySpaceSync);
  onActivated(startMemorySpaceSync);

  onDeactivated(stopMemorySpaceSync);
  onUnmounted(stopMemorySpaceSync);
}
