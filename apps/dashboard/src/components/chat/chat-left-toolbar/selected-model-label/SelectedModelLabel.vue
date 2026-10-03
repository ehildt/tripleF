<script setup lang="ts">
import { computed } from 'vue';

import type { SelectedModelLabelProps } from './SelectedModelLabel.types';

const props = defineProps<SelectedModelLabelProps>();

/** Em-dash fallback while nothing is selected — the box never renders empty. */
const displayName = computed(() => props.selectedModelName || '—');
</script>

<template>
  <span
    class="selected-model-label"
    :class="{ 'selected-model-label--missing': isModelMissing }"
    >{{ displayName }}</span
  >
</template>

<style scoped>
/* Same box the model menu used in the left toolbar: secondary panel, mono
   text; the name turns accent when the selected model is not in the
   catalog. */
.selected-model-label {
  display: block;
  width: 100%;
  box-sizing: border-box;
  padding: var(--spacing-2);
  text-align: right;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.selected-model-label--missing {
  color: var(--color-accent-primary);
}
</style>
