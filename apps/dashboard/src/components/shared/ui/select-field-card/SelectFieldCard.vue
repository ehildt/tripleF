<script setup lang="ts">
import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { SelectFieldCardProps } from './SelectFieldCard.types';

/**
 * Full-width setting row carrying a string select: icon tile, label +
 * description, and an InputSelect as the inline control. While `loading`
 * is set a skeleton bar (optionally tooltipped via `loadingLabel`) stands
 * in for the select.
 */
withDefaults(defineProps<SelectFieldCardProps>(), {
  disabled: false,
  checkmark: true,
  loading: false,
});

const model = defineModel<string>({ required: true });
</script>

<template>
  <div
    class="select-field-card"
    :class="{
      'select-field-card--disabled': disabled,
    }"
  >
    <div class="select-field-card__icon">
      <component :is="icon" class="select-field-card__icon-glyph" />
    </div>

    <div class="select-field-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="select-field-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="select-field-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div class="select-field-card__field">
      <Tooltip v-if="loading && loadingLabel" :text="loadingLabel">
        <span class="select-field-card__skeleton">
          <span class="select-field-card__skeleton-bar" />
        </span>
      </Tooltip>
      <span v-else-if="loading" class="select-field-card__skeleton">
        <span class="select-field-card__skeleton-bar" />
      </span>
      <InputSelect
        v-else
        v-model="model"
        :options="[...options]"
        :placeholder="placeholder"
        :disabled="disabled"
        :checkmark="checkmark"
        :format-value="formatValue"
      />
    </div>
  </div>
</template>

<style scoped>
.select-field-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  transition:
    background-color 0.2s ease,
    filter 0.2s ease,
    opacity 0.3s ease;
}

.select-field-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open dropdown inside one card would paint under the cards after it.
   While focus is inside (open select), lift the card. */
.select-field-card:focus-within {
  position: relative;
  z-index: 20;
}

.select-field-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.select-field-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.select-field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.select-field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.select-field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.select-field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline box — the card background is the select's frame (borderless button) */
.select-field-card__field {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}

.select-field-card__skeleton {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: 0 var(--spacing-1);
}

.select-field-card__skeleton-bar {
  width: 2.5rem;
  height: 0.75rem;
  background-color: var(--color-bg-tertiary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
