import { ref } from 'vue';

import type { MemorySubtab } from './use-memory-subtab.types';

const MEMORY_SUBTAB_STORAGE_KEY = 'vision-memory-subtab';

const MEMORY_SUBTABS: readonly MemorySubtab[] = [
  'config',
  'partition',
  'cognition',
  'lexicon',
];

function loadMemorySubtab(): MemorySubtab {
  try {
    const saved = localStorage.getItem(MEMORY_SUBTAB_STORAGE_KEY);
    return MEMORY_SUBTABS.includes(saved as MemorySubtab)
      ? (saved as MemorySubtab)
      : 'config';
  } catch {
    return 'config';
  }
}

/**
 * The active sub-section of the SysCtl Memory tab, persisted so the tab
 * reopens on the sub-section the user last configured.
 */
export function useMemorySubtab() {
  const activeSubtab = ref<MemorySubtab>(loadMemorySubtab());

  function selectSubtab(tab: MemorySubtab) {
    activeSubtab.value = tab;
    try {
      localStorage.setItem(MEMORY_SUBTAB_STORAGE_KEY, tab);
    } catch {
      /* storage unavailable — the selection stays in-memory only */
    }
  }

  return { activeSubtab, selectSubtab };
}
