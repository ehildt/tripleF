<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { SelectedModelLabelProps } from './SelectedModelLabel.types';

const props = defineProps<SelectedModelLabelProps>();

const { t } = useI18n();

/** While nothing is selected the box asks for a model instead of rendering
 *  empty — the same invitation the blinking model trigger makes. */
const hasNoModelSelected = computed(() => !props.selectedModelName);
const displayName = computed(
  () => props.selectedModelName || t('chat.selectModelPlaceholder'),
);
</script>

<template>
  <span
    class="selected-model-label"
    :class="{
      'selected-model-label--missing': isModelMissing,
      'selected-model-label--placeholder': hasNoModelSelected,
    }"
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

/* Placeholder invitation while no model is selected: muted so it reads as
   guidance, not as a picked model. */
.selected-model-label--placeholder {
  color: var(--color-fg-muted);
}
</style>
