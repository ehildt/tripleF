import { onMounted, ref } from 'vue';

import { fetchLexiconChunks, fetchLexiconLinks } from '@/api/memory.api';

import type {
  ConstellationLink,
  ConstellationNode,
} from '../../memory-constellation/MemoryConstellation.types';
import { buildLexiconNodes } from '../helpers/build-lexicon-nodes.helper';

/**
 * The lexicon constellation: the shared knowledge cache (verbatim chunks of
 * fetched web content), clustered by source domain. Read-only — the lexicon
 * is a global cache, so there is no wipe; the supersede sweep heals it in
 * the background. A fetch failure degrades to an unavailable note.
 */
export function useLexiconSpace() {
  const nodes = ref<ConstellationNode[]>([]);
  const links = ref<ConstellationLink[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  /** localStorage namespace for this space's expanded-cluster set. */
  const storageKey = 'lexicon';

  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    const [chunksResult, linksResult] = await Promise.allSettled([
      fetchLexiconChunks(),
      fetchLexiconLinks(),
    ]);
    if (chunksResult.status === 'fulfilled') {
      nodes.value = buildLexiconNodes(chunksResult.value);
    } else {
      nodes.value = [];
      isUnavailable.value = true;
    }
    links.value =
      linksResult.status === 'fulfilled'
        ? linksResult.value.map((link) => ({
            source: link.source,
            target: link.target,
            type: 'semantic' as const,
            score: link.score,
          }))
        : [];
    isLoading.value = false;
  }

  onMounted(refresh);

  return { nodes, links, isLoading, isUnavailable, refresh, storageKey };
}
