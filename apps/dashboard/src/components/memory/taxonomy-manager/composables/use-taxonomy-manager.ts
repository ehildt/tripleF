import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';

import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';
import {
  fetchMemoryTaxonomy,
  mergeMemoryTaxonomyNode,
  updateMemoryTaxonomyNode,
} from '@/api/memory-taxonomy.api';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';

import type { TaxonomyLane, TaxonomyTier } from './use-taxonomy-manager.types';

/** Tier display order. */
const TIER_ORDER = ['cluster', 'community', 'hub', 'tag'] as const;

/**
 * The taxonomy manager's state: one scope's macro-taxonomy (partition or
 * global encyclopedia) with the user's rename / merge / icon actions.
 * Every mutation re-reads the tree so the manager and the constellation
 * reflect the propagated taxonomy immediately.
 */
export function useTaxonomyManager() {
  const { memoryPartition } = storeToRefs(useAppStore());
  const toast = useToast();

  const lane = ref<TaxonomyLane>('partition');
  const nodes = ref<MemoryTaxonomyNodeRecord[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  /** The row whose inline editor is open (one at a time). */
  const editingId = ref<string | null>(null);

  const scopeKey = computed(() =>
    lane.value === 'partition'
      ? memoryPartition.value.trim() || 'default'
      : 'global',
  );

  /** Node id → node (parent-name lookup for ambiguous labels). */
  const nodesById = computed(
    () => new Map(nodes.value.map((node) => [node.id, node])),
  );

  const tiers = computed<TaxonomyTier[]>(() =>
    TIER_ORDER.map((kind) => ({
      kind,
      nodes: nodes.value
        .filter((node) => node.kind === kind)
        .sort(
          (a, b) => b.leafCount - a.leafCount || a.name.localeCompare(b.name),
        ),
    })),
  );

  const isEmpty = computed(() => nodes.value.length === 0);

  /** Display name with the parent label when it disambiguates duplicates. */
  function nodeLabel(node: MemoryTaxonomyNodeRecord): string {
    if (!node.parentId) return node.name;
    const parent = nodesById.value.get(node.parentId);
    return parent ? `${parent.name} › ${node.name}` : node.name;
  }

  /** Fetch the active scope's taxonomy (failures degrade to unavailable). */
  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    try {
      nodes.value = await fetchMemoryTaxonomy(lane.value, scopeKey.value);
    } catch (error) {
      nodes.value = [];
      isUnavailable.value = true;
      toast.debug(error instanceof Error ? error.message : String(error));
    } finally {
      isLoading.value = false;
    }
  }

  function toggleEditing(id: string): void {
    editingId.value = editingId.value === id ? null : id;
  }

  /** Rename a node (empty input is a no-op; server normalizes + propagates). */
  async function renameNode(
    node: MemoryTaxonomyNodeRecord,
    name: string,
  ): Promise<void> {
    const next = name.trim();
    if (!next || next === node.name) return;
    try {
      await updateMemoryTaxonomyNode(node.id, { name: next });
      toast.success(i18n.global.t('toast.taxonomyRenamed'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyRenameFailed'));
    }
    await refresh();
  }

  /** Merge a node into the target id (same tier + scope — server-enforced). */
  async function mergeNode(
    node: MemoryTaxonomyNodeRecord,
    into: string,
  ): Promise<void> {
    try {
      await mergeMemoryTaxonomyNode(node.id, into);
      toast.success(i18n.global.t('toast.taxonomyMerged'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyMergeFailed'));
    }
    await refresh();
  }

  /** Set or clear (null) a node's curated icon. */
  async function setIcon(
    node: MemoryTaxonomyNodeRecord,
    icon: string | null,
  ): Promise<void> {
    try {
      await updateMemoryTaxonomyNode(node.id, { icon });
      toast.success(i18n.global.t('toast.taxonomyIconUpdated'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyIconFailed'));
    }
    await refresh();
  }

  watch([lane, memoryPartition], refresh);

  return {
    lane,
    nodes,
    tiers,
    nodesById,
    isLoading,
    isUnavailable,
    isEmpty,
    editingId,
    nodeLabel,
    refresh,
    toggleEditing,
    renameNode,
    mergeNode,
    setIcon,
  };
}
