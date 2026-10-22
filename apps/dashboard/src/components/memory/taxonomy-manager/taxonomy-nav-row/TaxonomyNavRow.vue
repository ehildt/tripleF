<script setup lang="ts">
/**
 * One navigation row of the taxonomy drill: a kind-tinted icon chip, the
 * label, a trailing column of stat chips (leaves, linked, children), and a
 * chevron when the item has children. Clicking the row rotates the
 * manager's view to this item. The tier tint comes from the harmony
 * palette: cluster gold, community purple, hub orange, tag cadet —
 * wayfinding, not decoration. The tint reaches the elements through the
 * row-level --kind-tint custom property.
 */
import { ChevronRight } from '@lucide/vue';
import { computed } from 'vue';

import TaxonomyKindChip from '../shared/ui/taxonomy-kind-chip/TaxonomyKindChip.vue';
import TaxonomyStatChips from '../shared/ui/taxonomy-stat-chips/TaxonomyStatChips.vue';
import type {
  TaxonomyNavRowEmits,
  TaxonomyNavRowProps,
} from './TaxonomyNavRow.types';

const props = defineProps<TaxonomyNavRowProps>();
const emit = defineEmits<TaxonomyNavRowEmits>();

/** The kind modifier class on the row (sets the --kind-tint tint). */
const kindClass = computed(() => `taxonomy-nav-row--${props.item.kind}`);
</script>

<template>
  <li class="taxonomy-nav-row" :class="kindClass">
    <button
      type="button"
      class="taxonomy-nav-row__body"
      @click="emit('select')"
    >
      <TaxonomyKindChip :kind="item.kind" :icon-name="item.icon" size="sm" />
      <span class="taxonomy-nav-row__name">{{ label }}</span>
      <TaxonomyStatChips :item="item" class="taxonomy-nav-row__chips" />
      <ChevronRight
        v-if="item.childCount > 0"
        :size="16"
        class="taxonomy-nav-row__chevron"
      />
    </button>
  </li>
</template>

<style scoped>
.taxonomy-nav-row {
  border-bottom: 1px solid var(--color-divider);
}

.taxonomy-nav-row:last-child {
  border-bottom: none;
}

/* The tier's palette color for everything tinted on this row. */
.taxonomy-nav-row--cluster {
  --kind-tint: var(--color-harmony-1);
}

.taxonomy-nav-row--community {
  --kind-tint: var(--color-harmony-2);
}

.taxonomy-nav-row--hub {
  --kind-tint: var(--color-harmony-3);
}

.taxonomy-nav-row--tag {
  --kind-tint: var(--color-harmony-4);
}

.taxonomy-nav-row__body {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  background: none;
  border: none;
  border-left: 2px solid transparent;
  cursor: pointer;
  text-align: left;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.taxonomy-nav-row__body:hover {
  background-color: var(--color-bg-elevated);
  border-left-color: var(--kind-tint);
}

.taxonomy-nav-row__name {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--color-fg-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.taxonomy-nav-row__chips {
  flex-shrink: 0;
}

.taxonomy-nav-row__chevron {
  flex-shrink: 0;
  color: var(--color-fg-muted);
  transition:
    color 0.2s ease,
    transform 0.2s ease;
}

.taxonomy-nav-row__body:hover .taxonomy-nav-row__chevron {
  color: var(--color-accent-primary);
  transform: translateX(2px);
}
</style>
