<script setup lang="ts">
/**
 * The taxonomy manager: the user's rename/merge/icon surface over the
 * macro-taxonomy — the strict chain cluster → community → hub → node,
 * plus the flat tag vocabulary — of
 * one memory lane — the active partition, or the global encyclopedia. The
 * UI drills instead of expanding: the root view lists the tier groups
 * (clusters and tags); every click rotates the view into the clicked item
 * (its manage surface plus its child groups) as its own
 * history entry, and the address bar is the breadcrumb — kind/name path
 * segments, one history entry per level, so the browser's back/forward
 * buttons walk the drill and every level deep links. The registry is
 * read-only for the AI; every change here propagates across the graph
 * immediately (payloads rewrite, the old names stay as aliases), and the
 * constellation reflects it on its next read.
 */
import { onMounted } from 'vue';

import { TAXONOMY_ICON_NODES } from '../memory-constellation/helpers/taxonomy-icon-nodes.helper';
import { useTaxonomyManager } from './composables/use-taxonomy-manager';
import TaxonomyItemList from './taxonomy-item-list/TaxonomyItemList.vue';
import TaxonomyLeavesPanel from './taxonomy-leaves-panel/TaxonomyLeavesPanel.vue';
import TaxonomyManagerHeader from './taxonomy-manager-header/TaxonomyManagerHeader.vue';
import TaxonomyNavGroup from './taxonomy-nav-group/TaxonomyNavGroup.vue';

const {
  lane,
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
  scopeKey,
  refresh,
  descend,
  toggleEditing,
  renameNode,
  mergeNode,
  setIcon,
} = useTaxonomyManager();

/** The picker's icon names — the curated allowlist map keys. */
const iconNames = Object.keys(TAXONOMY_ICON_NODES);

onMounted(refresh);
</script>

<template>
  <main class="taxonomy-manager">
    <TaxonomyManagerHeader
      v-model:lane="lane"
      :is-loading="isLoading"
      @refresh="refresh"
    />

    <div v-if="isUnavailable" class="taxonomy-manager__state">
      {{ $t('common.memoryTaxonomyUnavailable') }}
    </div>

    <div
      v-if="!isUnavailable && isEmpty && !isLoading"
      class="taxonomy-manager__state"
    >
      {{ $t('common.memoryTaxonomyEmpty') }}
    </div>

    <TaxonomyNavGroup
      v-if="isReady && isAtRoot && clusterRoots.length > 0"
      kind="cluster"
      :items="clusterRoots"
      @select="descend"
    />

    <TaxonomyNavGroup
      v-if="isReady && isAtRoot && tagRoots.length > 0"
      kind="tag"
      :items="tagRoots"
      @select="descend"
    />

    <section v-if="isReady && currentItem" class="taxonomy-manager__view">
      <TaxonomyItemList
        :item="currentItem"
        :merge-candidates="currentSiblings"
        :candidate-label="itemLabel"
        :editing="editingId === currentItem.id"
        :icon-names="iconNames"
        @toggle-edit="toggleEditing(currentItem.id)"
        @rename="renameNode(currentItem, $event)"
        @merge="mergeNode(currentItem, $event)"
        @set-icon="setIcon(currentItem, $event)"
      />

      <TaxonomyLeavesPanel
        v-if="currentItem.kind === 'node' || currentItem.kind === 'tag'"
        :key="currentItem.id"
        :item="currentItem"
        :lane="lane"
        :scope-key="scopeKey"
      />
    </section>

    <TaxonomyNavGroup
      v-for="group in childGroups"
      :key="group.kind"
      :kind="group.kind"
      :items="group.items"
      @select="descend"
    />
  </main>
</template>

<style scoped>
.taxonomy-manager {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.taxonomy-manager__state {
  padding: var(--spacing-4);
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}

.taxonomy-manager__view {
  background-color: var(--color-bg-secondary);
  border: 1px solid var(--color-divider);
}
</style>
