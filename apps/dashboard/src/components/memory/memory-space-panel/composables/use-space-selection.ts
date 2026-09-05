import { computed, type Ref, ref } from 'vue';

import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { mapNodeToFrictions } from './helpers/map-node-to-frictions.helper';

/**
 * The metadata column's state: the currently selected node plus the
 * column's collapsed state (persisted per space). Clicking a dot selects it;
 * the panel's toggle collapses the column to the right. `selectedFrictions`
 * derives the selected dot's active conflicts from the space's friction set.
 */
export function useSpaceSelection(
  storageKey: string | undefined,
  frictions: Ref<readonly ConstellationFriction[] | undefined>,
) {
  const selectedNode = ref<ConstellationNode | null>(null);
  const metadataCollapsed = ref(loadMetadataCollapsed());

  /** The selected dot's open frictions (the contested warning rows). */
  const selectedFrictions = computed(() =>
    mapNodeToFrictions(selectedNode.value, frictions.value ?? []),
  );

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

  return {
    selectedNode,
    selectedFrictions,
    metadataCollapsed,
    selectNode,
    toggleMetadata,
  };
}
