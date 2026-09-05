<script setup lang="ts">
/**
 * One taxonomy tier section (clusters / communities / hubs / tags): the
 * section header row plus the tier's node list. Presentational — the rows
 * emit their mutations upward.
 */
import { ListTree } from '@lucide/vue';

import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';

import TaxonomyNodeRow from '../taxonomy-node-row/TaxonomyNodeRow.vue';
import type {
  TaxonomyTierSectionEmits,
  TaxonomyTierSectionProps,
} from './TaxonomyTierSection.types';

const props = defineProps<TaxonomyTierSectionProps>();
const emit = defineEmits<TaxonomyTierSectionEmits>();

/** Same-tier merge candidates per row (the row itself excluded). */
function candidatesFor(
  nodeId: string,
): readonly (typeof props.tier.nodes)[number][] {
  return props.tier.nodes.filter((node) => node.id !== nodeId);
}
</script>

<template>
  <section v-if="tier.nodes.length > 0" class="taxonomy-tier-section">
    <div class="taxonomy-tier-section__head">
      <SectionHeader :icon="ListTree" :title="title" />
      <p class="taxonomy-tier-section__desc">{{ description }}</p>
    </div>
    <ul class="taxonomy-tier-section__list">
      <TaxonomyNodeRow
        v-for="node in tier.nodes"
        :key="node.id"
        :node="node"
        :merge-candidates="candidatesFor(node.id)"
        :candidate-label="nodeLabel"
        :editing="editingId === node.id"
        :icon-names="iconNames"
        @toggle-edit="emit('toggleEdit', node.id)"
        @rename="emit('rename', node, $event)"
        @merge="emit('merge', node, $event)"
        @set-icon="emit('setIcon', node, $event)"
      />
    </ul>
  </section>
</template>

<style scoped>
.taxonomy-tier-section {
  border: 1px solid var(--color-divider);
  border-radius: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  overflow: hidden;
}

.taxonomy-tier-section__head {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-3);
  border-bottom: 1px solid var(--color-divider);
  background-color: var(--color-bg-elevated);
}

.taxonomy-tier-section__desc {
  margin: 0;
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.taxonomy-tier-section__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
</style>
