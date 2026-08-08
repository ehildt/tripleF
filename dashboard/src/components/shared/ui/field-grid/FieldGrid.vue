<script setup lang="ts">
import { computed } from 'vue';

/**
 * Renders two slots — `#prepend` and the default slot — each in its own grid
 * row. The caller decides how many items fit per row for each slot (e.g. half
 * the field count, capped at 5) and passes it via `prependItemsPerRow` and
 * `itemsPerRow`.
 */
const props = withDefaults(
  defineProps<{
    /** Items per row for the default slot. */
    itemsPerRow?: number;
    /** Items per row for the `#prepend` slot. */
    prependItemsPerRow?: number;
  }>(),
  { itemsPerRow: 5, prependItemsPerRow: 5 },
);

const defaultTemplate = computed(
  () => `repeat(${Math.max(1, props.itemsPerRow)}, minmax(0, 1fr))`,
);
const prependTemplate = computed(
  () => `repeat(${Math.max(1, props.prependItemsPerRow)}, minmax(0, 1fr))`,
);
</script>

<template>
  <div class="field-grid">
    <div
      v-if="$slots.prepend"
      class="field-grid__row"
      :style="{ gridTemplateColumns: prependTemplate }"
    >
      <slot name="prepend" />
    </div>

    <div
      class="field-grid__row"
      :style="{ gridTemplateColumns: defaultTemplate }"
    >
      <slot />
    </div>
  </div>
</template>

<style scoped>
.field-grid {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.field-grid__row {
  display: grid;
  gap: var(--spacing-1);
}
</style>
