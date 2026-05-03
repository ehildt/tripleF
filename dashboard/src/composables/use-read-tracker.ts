import { useStorage } from '@vueuse/core';
import { computed } from 'vue';

export function useReadTracker(storageKey: string) {
  const readIds = useStorage<string[]>(storageKey, [], localStorage, {
    mergeDefaults: true,
  });

  function persist() {
    // Triggered by mutations below; useStorage handles the actual write.
    // This function remains for API parity.
  }

  function markAsRead(id: string) {
    if (!id || readIds.value.includes(id)) return;
    readIds.value = [...readIds.value, id];
    persist();
  }

  function isRead(id: string) {
    return readIds.value.includes(id);
  }

  function unreadCount(liveIds: string[]) {
    const liveSet = new Set(liveIds);
    return liveSet.size - readIds.value.filter((id) => liveSet.has(id)).length;
  }

  function pruneMissing(liveIds: string[]) {
    const liveSet = new Set(liveIds);
    const next = readIds.value.filter((id) => liveSet.has(id));
    if (next.length !== readIds.value.length) {
      readIds.value = next;
      persist();
    }
  }

  function removeRead(id: string) {
    if (!readIds.value.includes(id)) return;
    readIds.value = readIds.value.filter((rid) => rid !== id);
    persist();
  }

  const readCount = computed(() => readIds.value.length);

  return {
    markAsRead,
    isRead,
    unreadCount,
    pruneMissing,
    removeRead,
    readCount,
  };
}
