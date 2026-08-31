import { ref } from 'vue';

import type { MemorySpaceSubtab } from './use-memory-space-subtab.types';

const MEMORY_SPACE_SUBTAB_STORAGE_KEY = 'vision-memory-space-subtab';

const MEMORY_SPACE_SUBTABS: readonly MemorySpaceSubtab[] = [
  'partition',
  'cognition',
  'encyclopedia',
];

function loadMemorySpaceSubtab(): MemorySpaceSubtab {
  try {
    const saved = localStorage.getItem(MEMORY_SPACE_SUBTAB_STORAGE_KEY);
    return MEMORY_SPACE_SUBTABS.includes(saved as MemorySpaceSubtab)
      ? (saved as MemorySpaceSubtab)
      : 'encyclopedia';
  } catch {
    return 'encyclopedia';
  }
}

/**
 * The active canvas of the top-level Memory tab (partition facts / cognition
 * insights / shared encyclopedia), persisted so the tab reopens on the last
 * viewed space. Defaults to the encyclopedia — the shared knowledge cache is
 * the broadest entry point.
 */
export function useMemorySpaceSubtab() {
  const activeSubtab = ref<MemorySpaceSubtab>(loadMemorySpaceSubtab());

  function selectSubtab(tab: MemorySpaceSubtab) {
    activeSubtab.value = tab;
    try {
      localStorage.setItem(MEMORY_SPACE_SUBTAB_STORAGE_KEY, tab);
    } catch {
      /* storage unavailable — the selection stays in-memory only */
    }
  }

  return { activeSubtab, selectSubtab };
}
