<script setup lang="ts">
/**
 * The kind-tinted icon chip of a taxonomy row: the item's curated icon (or
 * the shapes fallback) in a box tinted by the tier's harmony palette color
 * — cluster gold, community purple, hub orange, tag cadet. Wayfinding, not
 * decoration.
 */
import { Shapes } from '@lucide/vue';

import TaxonomyIcon from '@/components/shared/ui/taxonomy-icon/TaxonomyIcon.vue';

import type { TaxonomyKindChipProps } from './TaxonomyKindChip.types';

withDefaults(defineProps<TaxonomyKindChipProps>(), { size: 'md' });
</script>

<template>
  <span
    class="taxonomy-kind-chip"
    :class="[`taxonomy-kind-chip--${kind}`, `taxonomy-kind-chip--${size}`]"
    :title="iconName ?? ''"
  >
    <TaxonomyIcon
      v-if="iconName"
      :name="iconName"
      :size="size === 'sm' ? 16 : 20"
    />
    <Shapes v-if="!iconName" :size="size === 'sm' ? 16 : 20" />
  </span>
</template>

<style scoped>
.taxonomy-kind-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--color-fg-secondary);
  border: 1px solid var(--color-divider);
}

.taxonomy-kind-chip--sm {
  width: 1.5rem;
  height: 1.5rem;
}

.taxonomy-kind-chip--md {
  width: 2rem;
  height: 2rem;
}

/* The tier's palette color, once per kind; the box reads it below. */
.taxonomy-kind-chip--cluster {
  --kind-tint: var(--color-harmony-1);
}

.taxonomy-kind-chip--community {
  --kind-tint: var(--color-harmony-2);
}

.taxonomy-kind-chip--hub {
  --kind-tint: var(--color-harmony-3);
}

.taxonomy-kind-chip--node {
  --kind-tint: var(--color-harmony-5);
}

.taxonomy-kind-chip--tag {
  --kind-tint: var(--color-harmony-4);
}

.taxonomy-kind-chip--cluster,
.taxonomy-kind-chip--community,
.taxonomy-kind-chip--hub,
.taxonomy-kind-chip--node,
.taxonomy-kind-chip--tag {
  color: var(--kind-tint);
  border-color: color-mix(in srgb, var(--kind-tint) 40%, transparent);
}
</style>
