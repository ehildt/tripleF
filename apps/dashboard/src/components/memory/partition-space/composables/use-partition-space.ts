import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import {
  fetchMemoryClusters,
  fetchMemoryFacts,
  fetchMemoryFrictions,
  fetchMemoryLinks,
  wipeMemoryFacts,
} from '@/api/memory.api';
import { useMemoryOverrides } from '@/composables/use-memory-overrides';
import { useAppStore } from '@/stores/app';

import { mapFrictions } from '../../composables/helpers/map-frictions.helper';
import { mapLinkToEdge } from '../../composables/helpers/map-link-to-edge.helper';
import type {
  ConstellationClusterSummary,
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { buildPartitionNodes } from '../helpers/build-partition-nodes.helper';

/** Disarm window for the two-click wipe confirm (armed state auto-clears). */
const WIPE_ARM_WINDOW_MS = 4000;

/**
 * The partition constellation: the user's stored fact records for the active
 * partition key (the settings partition id, else the persistent session id),
 * grouped by topic tag. Reads on mount and on every key change; a fetch
 * failure degrades to an unavailable note — memory being off must never break
 * the settings tab.
 */
export function usePartitionSpace() {
  const { memoryPartition } = storeToRefs(useAppStore());
  const { constellationNodeLimit } = useMemoryOverrides();
  const partitionKey = computed(
    () => memoryPartition.value.trim() || 'default',
  );

  const nodes = ref<ConstellationNode[]>([]);
  const links = ref<ConstellationLink[]>([]);
  const frictions = ref<ConstellationFriction[]>([]);
  const clusters = ref<ConstellationClusterSummary[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  const wipeArmed = ref(false);
  let wipeDisarmTimer: ReturnType<typeof setTimeout> | undefined;

  const isEmpty = computed(() => nodes.value.length === 0);
  /** localStorage namespace for this space's expanded-topic set. */
  const storageKey = computed(() => `partition:${partitionKey.value}`);

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    const [factsResult, linksResult, frictionsResult, clustersResult] =
      await Promise.allSettled([
        fetchMemoryFacts(
          partitionKey.value,
          constellationNodeLimit.value ?? 5000,
        ),
        fetchMemoryLinks({ memoryPartition: partitionKey.value }),
        fetchMemoryFrictions({ memoryPartition: partitionKey.value }),
        fetchMemoryClusters(partitionKey.value),
      ]);
    if (factsResult.status === 'fulfilled') {
      nodes.value = buildPartitionNodes(factsResult.value);
    } else {
      nodes.value = [];
      isUnavailable.value = true;
    }
    links.value =
      linksResult.status === 'fulfilled'
        ? linksResult.value.map(mapLinkToEdge)
        : [];
    frictions.value =
      frictionsResult.status === 'fulfilled'
        ? mapFrictions(frictionsResult.value)
        : [];
    clusters.value =
      clustersResult.status === 'fulfilled'
        ? clustersResult.value.map((cluster) => ({
            id: cluster.id,
            title: cluster.title,
            summary: cluster.summary,
            memberIds: cluster.memberIds,
          }))
        : [];
    isLoading.value = false;
  }

  /** First click arms (a second within the window executes), then the partition is re-read. */
  async function handleWipeClick() {
    if (!wipeArmed.value) {
      wipeArmed.value = true;
      wipeDisarmTimer = setTimeout(() => {
        wipeArmed.value = false;
      }, WIPE_ARM_WINDOW_MS);
      return;
    }
    clearTimeout(wipeDisarmTimer);
    wipeArmed.value = false;
    try {
      await wipeMemoryFacts(partitionKey.value);
    } finally {
      await refresh();
    }
  }

  onMounted(refresh);
  watch(partitionKey, refresh);
  // A node-limit change (settings config) re-reads the space at the new cap.
  watch(constellationNodeLimit, refresh);

  return {
    nodes,
    links,
    frictions,
    clusters,
    isLoading,
    isUnavailable,
    isEmpty,
    refresh,
    wipeArmed,
    handleWipeClick,
    storageKey,
  };
}
