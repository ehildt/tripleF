import { onMounted, ref } from 'vue';
import { computed } from 'vue';

import {
  fetchEncyclopediaChunks,
  fetchEncyclopediaClusters,
  fetchEncyclopediaFrictions,
  fetchEncyclopediaLinks,
} from '@/api/memory.api';
import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';
import { fetchMemoryTaxonomy } from '@/api/memory-taxonomy.api';

import { buildLabelMeta } from '../../composables/helpers/build-label-meta.helper';
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
  const taxonomy = ref<MemoryTaxonomyNodeRecord[]>([]);
  /** Raw chunk records (kept for the label-meta graph-cluster aliasing). */
  const chunks = ref<
    readonly { id: string; category?: string; clusterId?: string }[]
  >([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  /** localStorage namespace for this space's expanded-topic set. */
  const storageKey = 'encyclopedia';
  /** Taxonomy metadata per macro-node dot id (icons + operational rows). */
  const labelMeta = computed(() =>
    buildLabelMeta(taxonomy.value, chunks.value),
  );

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    const [
      chunksResult,
      linksResult,
      frictionsResult,
      clustersResult,
      taxonomyResult,
    ] = await Promise.allSettled([
      fetchEncyclopediaChunks(),
      fetchEncyclopediaLinks(),
      fetchEncyclopediaFrictions(),
      fetchEncyclopediaClusters(),
      fetchMemoryTaxonomy('encyclopedia', 'global'),
    ]);
    if (chunksResult.status === 'fulfilled') {
      chunks.value = chunksResult.value;
      nodes.value = buildEncyclopediaNodes(chunksResult.value);
    } else {
      chunks.value = [];
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
    taxonomy.value =
      taxonomyResult.status === 'fulfilled' ? taxonomyResult.value : [];
    isLoading.value = false;
  }

  onMounted(refresh);

  return {
    nodes,
    links,
    frictions,
    clusters,
    labelMeta,
    isLoading,
    isUnavailable,
    refresh,
    storageKey,
  };
}
