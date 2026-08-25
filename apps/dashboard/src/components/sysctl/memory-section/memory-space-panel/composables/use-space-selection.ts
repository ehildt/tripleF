import { ref } from 'vue';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';

/**
 * The metadata column's state: the currently selected node plus the
 * column's collapsed state (persisted per space). Clicking a dot selects it;
 * the panel's toggle collapses the column to the right.
 */
export function useSpaceSelection(storageKey: string | undefined) {
  const selectedNode = ref<ConstellationNode | null>(null);
  const metadataCollapsed = ref(loadMetadataCollapsed());

  function selectNode(node: ConstellationNode) {
    selectedNode.value = node;
  }

  function toggleMetadata() {
    metadataCollapsed.value = !metadataCollapsed.value;
    saveMetadataCollapsed();
  }

  function loadMetadataCollapsed(): boolean {
    if (!storageKey) return false;
    try {
      return (
        localStorage.getItem(`memory-constellation:metadata:${storageKey}`) ===
        'true'
      );
    } catch {
      return false;
    }
  }

  function saveMetadataCollapsed(): void {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        `memory-constellation:metadata:${storageKey}`,
        String(metadataCollapsed.value),
      );
    } catch {
      /* ignore */
    }
  }

  return { selectedNode, metadataCollapsed, selectNode, toggleMetadata };
}
