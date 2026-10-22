import { onMounted, ref } from 'vue';

import type { MemoryTaxonomyLeafRecord } from '@/api/memory-taxonomy.api';
import { fetchMemoryTaxonomyLeaves } from '@/api/memory-taxonomy.api';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';

import type { TaxonomyLane } from './use-taxonomy-manager.types';

/**
 * One leaf panel's load: the node/tag view's whole payload is its leaves, so
 * the panel loads on mount and renders them immediately — no toggle. The
 * panel remounts per rotated item (keyed), so re-validation is free — a
 * rename/merge that changes the tree swaps the whole view anyway. The lane
 * and scope key vary per call site, hence the parameters.
 */
export function useTaxonomyLeaves(
  itemId: string,
  lane: () => TaxonomyLane,
  scopeKey: () => string,
) {
  const toast = useToast();

  const leaves = ref<MemoryTaxonomyLeafRecord[]>([]);
  const isLoading = ref(false);

  onMounted(async () => {
    isLoading.value = true;
    try {
      leaves.value = await fetchMemoryTaxonomyLeaves(
        itemId,
        lane(),
        scopeKey(),
      );
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyLeavesFailed'));
    } finally {
      isLoading.value = false;
    }
  });

  return { leaves, isLoading };
}
