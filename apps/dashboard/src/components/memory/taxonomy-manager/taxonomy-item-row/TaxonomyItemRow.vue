<script setup lang="ts">
/**
 * The current item's surface in the taxonomy drill — a cluster, community,
 * hub, or tag. A hero block: the kind-tinted icon chip, the identity column
 * (name, kind badge, stat chips, maintenance stamps, alias trail), and the
 * edit toggle, which expands the inline editor: rename, merge target
 * (combo-box over the merge candidates), and the curated icon picker grid.
 * Presentational: all mutations emit upward. The tier tint rides the
 * row-level --kind-tint custom property, set by the kind modifier.
 */
import { Pencil } from '@lucide/vue';
import { computed } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';

import TaxonomyKindChip from '../shared/ui/taxonomy-kind-chip/TaxonomyKindChip.vue';
import TaxonomyItemEditor from './taxonomy-item-editor/TaxonomyItemEditor.vue';
import TaxonomyItemIdentity from './taxonomy-item-identity/TaxonomyItemIdentity.vue';
import type {
  TaxonomyItemRowEmits,
  TaxonomyItemRowProps,
} from './TaxonomyItemRow.types';

const props = defineProps<TaxonomyItemRowProps>();
const emit = defineEmits<TaxonomyItemRowEmits>();

/** The kind modifier class on the row (sets the --kind-tint tint). */
const kindClass = computed(() => `taxonomy-item-row--${props.item.kind}`);
</script>

<template>
  <li
    class="taxonomy-item-row"
    :class="[kindClass, { 'taxonomy-item-row--editing': editing }]"
  >
    <div class="taxonomy-item-row__main">
      <TaxonomyKindChip :kind="item.kind" :icon-name="item.icon" />
      <TaxonomyItemIdentity :item="item" />
      <IconButton
        :title="$t('common.memoryTaxonomyEdit')"
        size="sm"
        :active="editing"
        @click="emit('toggleEdit')"
      >
        <Pencil :size="16" />
      </IconButton>
    </div>

    <TaxonomyItemEditor
      v-if="editing"
      :item="item"
      :merge-candidates="mergeCandidates"
      :candidate-label="candidateLabel"
      :icon-names="iconNames"
      :on-rename="(name) => emit('rename', name)"
      :on-merge="(targetId) => emit('merge', targetId)"
      :on-set-icon="(icon) => emit('setIcon', icon)"
    />
  </li>
</template>

<style scoped>
.taxonomy-item-row {
  padding: var(--spacing-3);
  background-color: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-divider);
  border-top: 2px solid transparent;
}

/* The tier's palette color for everything tinted on this row. */
.taxonomy-item-row--cluster {
  --kind-tint: var(--color-harmony-1);
}

.taxonomy-item-row--community {
  --kind-tint: var(--color-harmony-2);
}

.taxonomy-item-row--hub {
  --kind-tint: var(--color-harmony-3);
}

.taxonomy-item-row--node {
  --kind-tint: var(--color-harmony-5);
}

.taxonomy-item-row--tag {
  --kind-tint: var(--color-harmony-4);
}

.taxonomy-item-row--cluster,
.taxonomy-item-row--community,
.taxonomy-item-row--hub,
.taxonomy-item-row--node,
.taxonomy-item-row--tag {
  border-top-color: color-mix(in srgb, var(--kind-tint) 45%, transparent);
}

.taxonomy-item-row--editing {
  background-color: color-mix(
    in srgb,
    var(--color-bg-elevated) 70%,
    var(--color-bg-secondary)
  );
}

.taxonomy-item-row__main {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
}
</style>
