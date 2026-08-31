import { onMounted, ref } from 'vue';

import {
  fetchEncyclopediaChunks,
  fetchEncyclopediaClusters,
  fetchEncyclopediaFrictions,
  fetchEncyclopediaLinks,
} from '@/api/memory.api';

import { mapFrictions } from '../../composables/helpers/map-frictions.helper';
import { mapLinkToEncyclopediaEdge } from '../../composables/helpers/map-link-to-encyclopedia-edge.helper';
import type {
  ConstellationClusterSummary,
  ConstellationFriction,
  ConstellationLink,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { buildEncyclopediaNodes } from '../helpers/build-encyclopedia-nodes.helper';

/**
 * The encyclopedia constellation: the shared knowledge cache (verbatim chunks of
 * fetched web content), grouped by source domain. Read-only — the encyclopedia
 * is a global cache, so there is no wipe; the supersede sweep heals it in
 * the background. A fetch failure degrades to an unavailable note.
 */
export function useEncyclopediaSpace() {
  const nodes = ref<ConstellationNode[]>([]);
  const links = ref<ConstellationLink[]>([]);
  const frictions = ref<ConstellationFriction[]>([]);
  const clusters = ref<ConstellationClusterSummary[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  /** localStorage namespace for this space's expanded-topic set. */
  const storageKey = 'encyclopedia';

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    const [chunksResult, linksResult, frictionsResult, clustersResult] =
      await Promise.allSettled([
        fetchEncyclopediaChunks(),
        fetchEncyclopediaLinks(),
        fetchEncyclopediaFrictions(),
        fetchEncyclopediaClusters(),
      ]);
    if (chunksResult.status === 'fulfilled') {
      nodes.value = buildEncyclopediaNodes(chunksResult.value);
    } else {
      nodes.value = [];
      isUnavailable.value = true;
    }
    links.value =
      linksResult.status === 'fulfilled'
        ? linksResult.value.map(mapLinkToEncyclopediaEdge)
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

  onMounted(refresh);

  return {
    nodes,
    links,
    frictions,
    clusters,
    isLoading,
    isUnavailable,
    refresh,
    storageKey,
  };
}
