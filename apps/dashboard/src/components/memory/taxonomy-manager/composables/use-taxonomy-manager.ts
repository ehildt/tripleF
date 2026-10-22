import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import type { MemoryTaxonomyNodeRecord } from '@/api/memory-taxonomy.api';
import {
  fetchMemoryTaxonomy,
  mergeMemoryTaxonomyNode,
  updateMemoryTaxonomyNode,
} from '@/api/memory-taxonomy.api';
import { useToast } from '@/composables/use-toast';
import { i18n } from '@/i18n/i18n';
import { useAppStore } from '@/stores/app';

import type { TaxonomyLane } from './use-taxonomy-manager.types';

/**
 * The STRICT drill chain: cluster → community → hub → node → leaf — no
 * shortcuts, no tier skipping (the write boundary refuses partial chains).
 * Tags are flat recall vocabulary at the root; nodes and hubs are the
 * drill's bottom, their content is the leaves panel.
 */
const CHILD_TIERS: Record<string, readonly ('community' | 'hub' | 'node')[]> = {
  cluster: ['community'],
  community: ['hub'],
  hub: ['node'],
  node: [],
  tag: [],
};

/** One labeled tier group of a level's child listing. */
export interface TaxonomyChildGroup {
  kind: 'community' | 'hub' | 'node';
  items: MemoryTaxonomyNodeRecord[];
}

/** Tier groups at the root of the drill: clusters and flat tags. */
type TaxonomyRootKind = 'cluster' | 'tag';

/** Kinds that can open a drill chain at root level. */
const ROOT_KINDS: readonly string[] = ['cluster', 'tag'];

/** Leaf-heavy first, name-stable secondary ordering for nav lists. */
function byLeafCountThenName(
  a: MemoryTaxonomyNodeRecord,
  b: MemoryTaxonomyNodeRecord,
): number {
  return b.leafCount - a.leafCount || a.name.localeCompare(b.name);
}

/**
 * The URL segments for a resolved drill chain: alternating kind/name pairs
 * (`/memory/cluster/games/community/action`). The kind segment makes every
 * level unambiguous (a cluster and a tag may share a name).
 */
function segmentsFor(chain: MemoryTaxonomyNodeRecord[]): string[] {
  return chain.flatMap((item) => [item.kind, item.name]);
}

/**
 * Matches one segment pair against the registry at the chain's current
 * position: no anchor requires a root-level item of a navigable kind; with
 * an anchor the pair must be its direct child in a legal child tier.
 */
function findDrillMatch(
  registry: MemoryTaxonomyNodeRecord[],
  anchor: MemoryTaxonomyNodeRecord | undefined,
  kind: string,
  name: string,
): MemoryTaxonomyNodeRecord | undefined {
  if (!anchor) {
    if (!ROOT_KINDS.includes(kind)) return undefined;
    return registry.find(
      (entry) =>
        entry.parentId === '' && entry.kind === kind && entry.name === name,
    );
  }
  if (!(CHILD_TIERS[anchor.kind] as readonly string[]).includes(kind))
    return undefined;
  return registry.find(
    (entry) =>
      entry.parentId === anchor.id &&
      entry.kind === kind &&
      entry.name === name,
  );
}

/**
 * Walks the URL's kind/name segment pairs down the loaded registry: the
 * first pair must be a root-level item of a navigable kind, each next pair
 * must be the previous item's direct child of one of its legal child tiers
 * (CHILD_TIERS). Stops at the first pair nothing matches — the caller trims
 * the URL to the resolved prefix.
 */
function resolveDrillChain(
  registry: MemoryTaxonomyNodeRecord[],
  segments: string[],
): MemoryTaxonomyNodeRecord[] {
  const chain: MemoryTaxonomyNodeRecord[] = [];
  let parent: MemoryTaxonomyNodeRecord | undefined;
  for (let index = 0; index + 1 < segments.length; index += 2) {
    const next = findDrillMatch(
      registry,
      parent,
      segments[index],
      segments[index + 1],
    );
    if (!next) break;
    chain.push(next);
    parent = next;
  }
  return chain;
}

/**
 * The taxonomy manager's state: one scope's macro-taxonomy (partition or
 * global encyclopedia) plus its drill navigation. The drill is URL-backed:
 * the route's path segments ARE the breadcrumb trail (alternating
 * kind/name pairs, e.g. `/memory/cluster/games/community/action`), every
 * click pushes one history entry — so the browser's back/forward buttons
 * walk the drill, and any level is a readable, shareable deep link. The
 * lane lives in the `?lane=` query (drill ids are lane-scoped). Rename /
 * merge / icon actions operate on the item the view is rotated into. Every
 * mutation re-reads the tree so the manager and the constellation reflect
 * the propagated taxonomy immediately.
 */
export function useTaxonomyManager() {
  const route = useRoute();
  const router = useRouter();
  const { memoryPartition } = storeToRefs(useAppStore());
  const toast = useToast();

  /**
   * The taxonomy lane — backed by the ?lane= query ('partition' is the
   * default and renders without the parameter). Setting it pushes a
   * history entry, so back/forward can undo a lane switch.
   */
  const lane = computed<TaxonomyLane>({
    get: () =>
      route.query.lane === 'encyclopedia' ? 'encyclopedia' : 'partition',
    set: (next) => {
      const nextQuery = next === 'partition' ? undefined : next;
      if (route.query.lane === nextQuery) return;
      void router.push({
        name: 'memory',
        params: route.params,
        query: { ...route.query, lane: nextQuery },
      });
    },
  });

  /**
   * The drill chain's raw URL segment pairs, kind first (/memory/cluster/
   * games/...). The URL is the single source of truth: derived, never
   * synced, so no two-way binding and no feedback loop.
   */
  const drillSegments = computed<string[]>(() => {
    const raw = route.params.drill;
    if (typeof raw === 'string') return raw.length > 0 ? [raw] : [];
    return (raw ?? []).filter((segment) => segment.length > 0);
  });

  const items = ref<MemoryTaxonomyNodeRecord[]>([]);
  const isLoading = ref(false);
  const isUnavailable = ref(false);
  /** The current item's inline editor is open (one at a time). */
  const editingId = ref<string | null>(null);

  const scopeKey = computed(() =>
    lane.value === 'partition'
      ? memoryPartition.value.trim() || 'default'
      : 'global',
  );

  /** Item id → item (parent-name lookup for ambiguous labels). */
  const itemsById = computed(
    () => new Map(items.value.map((item) => [item.id, item])),
  );

  const isEmpty = computed(() => items.value.length === 0);

  /** Content branches gate on this: data in, nothing failed. */
  const isReady = computed(() => !isUnavailable.value && !isEmpty.value);

  /** The resolved drill chain, root item first (empty on the root view). */
  const drilledItems = computed(() =>
    resolveDrillChain(items.value, drillSegments.value),
  );

  const isAtRoot = computed(() => drilledItems.value.length === 0);

  /** The item the view is rotated into (null on the root view). */
  const currentItem = computed<MemoryTaxonomyNodeRecord | null>(
    () => drilledItems.value[drilledItems.value.length - 1] ?? null,
  );

  /** Root-view entries of one group kind (clusters, tags, or direct hubs). */
  function rootEntries(kind: TaxonomyRootKind) {
    return items.value
      .filter((item) => item.parentId === '' && item.kind === kind)
      .sort(byLeafCountThenName);
  }

  const clusterRoots = computed(() => rootEntries('cluster'));
  const tagRoots = computed(() => rootEntries('tag'));

  /** The current item's children as tier groups (communities first, then hubs). */
  const childGroups = computed<TaxonomyChildGroup[]>(() => {
    const item = currentItem.value;
    if (!item) return [];
    return CHILD_TIERS[item.kind]
      .map((kind) => ({
        kind,
        items: items.value
          .filter((entry) => entry.parentId === item.id && entry.kind === kind)
          .sort(byLeafCountThenName),
      }))
      .filter((group) => group.items.length > 0);
  });

  /** Same-kind siblings of the current item — its merge candidates. */
  const currentSiblings = computed<MemoryTaxonomyNodeRecord[]>(() => {
    const item = currentItem.value;
    if (!item) return [];
    return items.value.filter(
      (other) =>
        other.id !== item.id &&
        other.parentId === item.parentId &&
        other.kind === item.kind,
    );
  });

  /** Merge-option labels: the parent name disambiguates duplicate names. */
  function itemLabel(item: MemoryTaxonomyNodeRecord): string {
    if (!item.parentId) return item.name;
    const parent = itemsById.value.get(item.parentId);
    return parent ? `${parent.name} › ${item.name}` : item.name;
  }

  /** Fetch the active scope's taxonomy (failures degrade to unavailable). */
  async function refresh() {
    isLoading.value = true;
    isUnavailable.value = false;
    try {
      items.value = await fetchMemoryTaxonomy(lane.value, scopeKey.value);
      pruneDrillPath();
    } catch (error) {
      items.value = [];
      isUnavailable.value = true;
      toast.debug(error instanceof Error ? error.message : String(error));
    } finally {
      isLoading.value = false;
    }
  }

  /** Rotate the view into an item — pushes one history entry per level. */
  function descend(id: string): void {
    const item = itemsById.value.get(id);
    if (!item) return;
    const chain = [...drilledItems.value, item];
    void router.push({
      name: 'memory',
      params: { drill: segmentsFor(chain) },
      query: route.query,
    });
  }

  function toggleEditing(id: string): void {
    editingId.value = editingId.value === id ? null : id;
  }

  /** Rename an item (empty input is a no-op; server normalizes + propagates). */
  async function renameNode(
    item: MemoryTaxonomyNodeRecord,
    name: string,
  ): Promise<void> {
    const next = name.trim();
    if (!next || next === item.name) return;
    try {
      await updateMemoryTaxonomyNode(item.id, { name: next });
      toast.success(i18n.global.t('toast.taxonomyRenamed'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyRenameFailed'));
    }
    await refresh();
  }

  /** Merge an item into the target id (same tier + scope — server-enforced). */
  async function mergeNode(
    item: MemoryTaxonomyNodeRecord,
    into: string,
  ): Promise<void> {
    try {
      await mergeMemoryTaxonomyNode(item.id, into);
      toast.success(i18n.global.t('toast.taxonomyMerged'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyMergeFailed'));
    }
    await refresh();
  }

  /** Set or clear (null) an item's curated icon. */
  async function setIcon(
    item: MemoryTaxonomyNodeRecord,
    icon: string | null,
  ): Promise<void> {
    try {
      await updateMemoryTaxonomyNode(item.id, { icon });
      toast.success(i18n.global.t('toast.taxonomyIconUpdated'));
    } catch (error) {
      toast.debug(error instanceof Error ? error.message : String(error));
      toast.error(i18n.global.t('toast.taxonomyIconFailed'));
    }
    await refresh();
  }

  watch([lane, memoryPartition], refresh);

  // Renames/merges can vanish entries — keep the drill state consistent.
  // Runs after every successful fetch (never mid-load, so a deep link isn't
  // trimmed before its items arrive); the URL correction replaces, it must
  // not pollute history.
  function pruneDrillPath(): void {
    const chain = resolveDrillChain(items.value, drillSegments.value);
    if (drillSegments.value.length !== segmentsFor(chain).length) {
      void router.replace({
        name: 'memory',
        params: { drill: chain.length > 0 ? segmentsFor(chain) : undefined },
        query: route.query,
      });
    }
    const ids = new Set(items.value.map((item) => item.id));
    if (editingId.value && !ids.has(editingId.value)) editingId.value = null;
  }

  // A level change (nav row, back/forward) closes the editor.
  watch(drilledItems, () => (editingId.value = null));

  return {
    lane,
    items,
    itemsById,
    scopeKey,
    isLoading,
    isUnavailable,
    isEmpty,
    isReady,
    isAtRoot,
    currentItem,
    clusterRoots,
    tagRoots,
    childGroups,
    currentSiblings,
    editingId,
    itemLabel,
    refresh,
    descend,
    toggleEditing,
    renameNode,
    mergeNode,
    setIcon,
  };
}
