import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import {
  fetchEncyclopediaClusters,
  fetchMemoryClusters,
  type MemoryClusterRecord,
} from '@/api/memory.api';
import { useAppStore } from '@/stores/app';

import { buildSynopsisLayout } from '../helpers/build-synopsis-layout.helper';

/** Which lane's hierarchy the synopsis canvas shows. */
export type SynopsisScope = 'encyclopedia' | 'partition';

/**
 * The synopsis canvas's data: the detected cluster hierarchy (Raptor rows —
 * every level, linked by parentId) of the selected scope, laid out
 * deterministically. Defaults to the encyclopedia (the broadest scope). A
 * fetch failure degrades to an unavailable note — memory being off must
 * never break the tab.
 */
export function useSynopsisSpace() {
  const { memoryPartition } = storeToRefs(useAppStore());
  const partitionKey = computed(
    () => memoryPartition.value.trim() || 'default',
  );

  const scope = ref<SynopsisScope>('encyclopedia');
  const clusters = ref<MemoryClusterRecord[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);

  const isEmpty = computed(() => clusters.value.length === 0);
  const layout = computed(() => buildSynopsisLayout(clusters.value));
  const nodes = computed(() => layout.value.nodes);
  const links = computed(() => layout.value.links);

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    try {
      clusters.value =
        scope.value === 'encyclopedia'
          ? await fetchEncyclopediaClusters()
          : await fetchMemoryClusters(partitionKey.value);
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

  onMounted(refresh);
  watch(partitionKey, refresh);

  return {
    scope,
    nodes,
    links,
    clusters,
    isLoading,
    isUnavailable,
    isEmpty,
    refresh,
    setScope,
  };
}
