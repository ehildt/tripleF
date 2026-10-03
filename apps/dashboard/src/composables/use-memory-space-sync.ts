import { onActivated, onDeactivated, onMounted, onUnmounted } from 'vue';

import { useAppStore } from '@/stores/app';

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
 * store sees exactly one sync per open and one cancel per close.
 */
export function useMemorySpaceSync(): void {
  const appStore = useAppStore();

  let syncActive = false;

  function startMemorySpaceSync(): void {
    if (syncActive) return;
    syncActive = true;
    void appStore.syncMemorySpacesFromServer();
  }

  function stopMemorySpaceSync(): void {
    if (!syncActive) return;
    syncActive = false;
    appStore.cancelMemorySpaceSync();
  }

  onMounted(startMemorySpaceSync);
  onActivated(startMemorySpaceSync);

  onDeactivated(stopMemorySpaceSync);
  onUnmounted(stopMemorySpaceSync);
}
