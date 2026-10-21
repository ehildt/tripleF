<script setup lang="ts">
import { Check } from '@lucide/vue';

import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { NumberFieldCardProps } from './NumberFieldCard.types';

/**
 * Full-width setting row in the image-variant design: icon tile, label +
 * description, an optional inline number stepper (rendered when `numberValue`
 * is set), and an optional on/off checkbox (rendered when `checked` is set).
 * Both control areas are plain optional props — this card renders numbers
 * only; text, select, model and segmented variants are their own components
 * (TextFieldCard, SelectFieldCard, ModelFieldCard, SegmentedFieldCard).
 * The `tone` prop switches the accent between the app accent and the
 * preprocessing accent.
 */
withDefaults(defineProps<NumberFieldCardProps>(), {
  showCheckbox: true,
  numberDisabled: false,
  tone: 'accent',
});

const emit = defineEmits<{
  toggle: [];
  'update:numberValue': [value: number];
}>();
</script>

<template>
  <div
    class="number-field-card"
    :class="{
      'number-field-card--checked': checked && !disabled,
      'number-field-card--highlighted': highlighted,
      'number-field-card--disabled': disabled,
      'number-field-card--preprocessing': tone === 'preprocessing',
    }"
  >
    <div v-if="icon" class="number-field-card__icon">
      <component :is="icon" class="number-field-card__icon-glyph" />
    </div>

    <div class="number-field-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="number-field-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="number-field-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div v-if="numberValue !== undefined" class="number-field-card__number">
      <InputNumber
        :model-value="numberValue"
        :step="numberStep"
        :placeholder="numberPlaceholder"
        :min="numberMin"
        :max="numberMax"
        :disabled="disabled || numberDisabled"
        @update:model-value="emit('update:numberValue', $event)"
      />
    </div>

    <button
      v-if="checked !== undefined && showCheckbox"
      type="button"
      class="number-field-card__checkbox"
      :class="{ 'number-field-card__checkbox--checked': checked }"
      :disabled="disabled"
      :aria-pressed="checked"
      @click="emit('toggle')"
    >
      <Check
        v-if="checked"
        class="number-field-card__check-icon"
        stroke-width="3"
      />
    </button>
  </div>
</template>

<style scoped>
.number-field-card {
  --number-field-accent: var(--color-accent-primary);

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

.number-field-card--preprocessing {
  --number-field-accent: var(--color-tab-preprocessing);
}

.number-field-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open dropdown inside one card would paint under the cards after it.
   While focus is inside (open select, editing number), lift the card. */
.number-field-card:focus-within {
  position: relative;
  z-index: 20;
}

.number-field-card--checked {
  background-color: color-mix(
    in srgb,
    var(--number-field-accent) 8%,
    var(--color-bg-tertiary)
  );
}

.number-field-card--highlighted {
  background-color: color-mix(
    in srgb,
    var(--number-field-accent) 12%,
    var(--color-bg-tertiary)
  );
  filter: brightness(1.1);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.number-field-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Icon tile (variant style) */
.number-field-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.number-field-card--checked .number-field-card__icon {
  background-color: color-mix(
    in srgb,
    var(--number-field-accent) 20%,
    transparent
  );
  color: var(--number-field-accent);
}

.number-field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

/* Label + description */
.number-field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.number-field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.number-field-card--checked .number-field-card__label {
  color: var(--color-fg-primary);
}

.number-field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Compact inline number box */
.number-field-card__number {
  flex-shrink: 0;
  width: 4.5rem;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}

/* Checkbox */
.number-field-card__checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-fg-muted);
  background: none;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.number-field-card__checkbox:hover:not(:disabled) {
  border-color: var(--color-fg-secondary);
}

.number-field-card__checkbox--checked {
  border-color: var(--number-field-accent);
  background-color: var(--number-field-accent);
}

.number-field-card__checkbox:disabled {
  opacity: 0.4;
  cursor: default;
}

.number-field-card__check-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-fg-inverse);
}
</style>
