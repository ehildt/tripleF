<script setup lang="ts">
import ModelSelectField from '@/components/shared/ui/model-select-field/ModelSelectField.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { ModelFieldCardProps } from './ModelFieldCard.types';

/**
 * Full-width setting row carrying a model picker: icon tile, label +
 * description, and a ModelSelectField as the inline control (borderless
 * trigger, teleported searchable dropdown). Used for the memory sweep model
 * overrides and the DLQ filter's model. The value syncs via `v-model`; an
 * empty value stands for the env baseline (see `defaultLabel`).
 */
withDefaults(defineProps<ModelFieldCardProps>(), {
  disabled: false,
  errored: false,
});

const model = defineModel<string>({ default: '' });
</script>

<template>
  <div class="model-field-card">
    <div class="model-field-card__icon">
      <component :is="icon" class="model-field-card__icon-glyph" />
    </div>

    <div class="model-field-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="model-field-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="model-field-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div class="model-field-card__field">
      <ModelSelectField
        v-model="model"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="loading"
        :default-label="defaultLabel"
        :disabled="disabled"
        :errored="errored"
      />
    </div>
  </div>
</template>

<style scoped>
.model-field-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  transition:
    background-color 0.2s ease,
    filter 0.2s ease;
}

.model-field-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open model dropdown inside one card would paint under the cards after
   it. While focus is inside (open picker), lift the card. */
.model-field-card:focus-within {
  position: relative;
  z-index: 20;
}

.model-field-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.model-field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.model-field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.model-field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.model-field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline box — the card background is the trigger's frame */
.model-field-card__field {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}
</style>
