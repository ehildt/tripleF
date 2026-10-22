import { computed, ref } from 'vue';

import {
  fetchEncyclopediaClusters,
  fetchMemoryClusters,
  type MemoryClusterRecord,
} from '@/api/memory.api';
import { useAppStore } from '@/stores/app';

import type { SynopsisScope } from './use-synopsis-space.types';
import { useSynopsisTree } from './use-synopsis-tree';

/**
 * The synopsis tree's data — a module-scope singleton: the synopsis is one
 * view, and the recursive tree nodes read the same records through this
 * composable (no prop threading across the recursion). Holds the Raptor
 * cluster hierarchy of the selected scope (encyclopedia by default — the
 * broadest scope) plus the parentId groupings the tree folds around. The
 * orchestrator owns the lifecycle: it calls `refresh` on mount and on
 * partition changes. A fetch failure degrades to an unavailable note —
 * memory being off must never break the tab.
 */
const scope = ref<SynopsisScope>('encyclopedia');
const clusters = ref<MemoryClusterRecord[]>([]);
const isLoading = ref(false);
const isUnavailable = ref(false);

const isEmpty = computed(() => clusters.value.length === 0);

/** Top-level rows: hierarchy roots (absent parent), title-sorted. */
const roots = computed<readonly MemoryClusterRecord[]>(() =>
  clusters.value
    .filter((cluster) => !cluster.parentId)
    .sort((a, b) => a.title.localeCompare(b.title)),
);

/** Parent id → title-sorted child rows (the tree's per-level children). */
const childrenByParent = computed<
  ReadonlyMap<string, readonly MemoryClusterRecord[]>
>(() => {
  const map = new Map<string, MemoryClusterRecord[]>();
  for (const cluster of clusters.value) {
    if (!cluster.parentId) continue;
    map.set(cluster.parentId, [...(map.get(cluster.parentId) ?? []), cluster]);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return map;
});

async function refresh() {
  // Store access happens at call time: the records above are module-scope
  // (declared before Pinia activates), stores are only safe post-mount.
  const { memoryPartition } = useAppStore();
  isLoading.value = true;
  isUnavailable.value = false;
  try {
    clusters.value =
      scope.value === 'encyclopedia'
        ? await fetchEncyclopediaClusters()
        : await fetchMemoryClusters(memoryPartition.trim() || 'default');
    // Fresh data reset: root rows open, deeper levels collapsed (singleton).
    useSynopsisTree().seedExpanded(roots.value.map((node) => node.id));
  } catch {
    clusters.value = [];
    isUnavailable.value = true;
  } finally {
    isLoading.value = false;
  }
}

function setScope(next: SynopsisScope) {
  if (scope.value === next) return;
  scope.value = next;
  void refresh();
}

export function useSynopsisSpace() {
  return {
    scope,
    clusters,
    isLoading,
    isUnavailable,
    isEmpty,
    roots,
    childrenByParent,
    refresh,
    setScope,
  };
}
