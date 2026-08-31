import { storeToRefs } from 'pinia';
import { computed, onMounted, ref, watch } from 'vue';

import {
  fetchMemoryCognition,
  fetchMemoryFrictions,
  fetchMemoryLinks,
  wipeMemoryCognition,
} from '@/api/memory.api';
import { useAppStore } from '@/stores/app';

import { mapFrictions } from '../../composables/helpers/map-frictions.helper';
import { mapLinkToEdge } from '../../composables/helpers/map-link-to-edge.helper';
import type {
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { buildCognitionNodes } from '../helpers/build-cognition-nodes.helper';

/** Disarm window for the two-click wipe confirm (armed state auto-clears). */
const WIPE_ARM_WINDOW_MS = 4000;

/**
 * The cognition constellation: the AI's accumulated understanding of the user
 * for the active cognition space (the sysctl cognition id, else the memory
 * partition, else the session id) — the profile hub plus path-grouped
 * insights. Reads on mount and on every space change; a fetch failure
 * degrades to an unavailable note.
 */
export function useCognitionSpace() {
  const { memoryCognition, memoryPartition } = storeToRefs(useAppStore());
  const cognitionKey = computed(
    () =>
      memoryCognition.value.trim() || memoryPartition.value.trim() || 'default',
  );

  const nodes = ref<ConstellationNode[]>([]);
  const links = ref<ConstellationLink[]>([]);
  const frictions = ref<ConstellationFriction[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  const wipeArmed = ref(false);
  let wipeDisarmTimer: ReturnType<typeof setTimeout> | undefined;

  const isEmpty = computed(() => nodes.value.length === 0);
  /** localStorage namespace for this space's expanded-topic set. */
  const storageKey = computed(() => `cognition:${cognitionKey.value}`);

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    const [snapshotResult, linksResult, frictionsResult] =
      await Promise.allSettled([
        fetchMemoryCognition(cognitionKey.value),
        fetchMemoryLinks({ memoryCognition: cognitionKey.value }),
        fetchMemoryFrictions({ memoryCognition: cognitionKey.value }),
      ]);
    if (snapshotResult.status === 'fulfilled') {
      nodes.value = buildCognitionNodes(
        snapshotResult.value.profile,
        snapshotResult.value.insights,
        snapshotResult.value.convictions,
      );
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
    isLoading.value = false;
  }

  /** First click arms (a second within the window executes), then the space is re-read. */
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
      await wipeMemoryCognition(cognitionKey.value);
    } finally {
      await refresh();
    }
  }

  onMounted(refresh);
  watch(cognitionKey, refresh);

  return {
    nodes,
    links,
    frictions,
    isLoading,
    isUnavailable,
    isEmpty,
    refresh,
    wipeArmed,
    handleWipeClick,
    storageKey,
  };
}
