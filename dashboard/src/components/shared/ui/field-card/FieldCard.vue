<script setup lang="ts">
import { Check, type LucideIcon } from '@lucide/vue';

import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';

/**
 * Full-width field row in the image-variant design: icon tile, label +
 * description, an optional inline number field (rendered when the field
 * takes a number), and a checkbox for on/off. A #field slot accepts any
 * other inline control (e.g. a text input) in place of the number field.
 * Used across sysctl and the preprocessing panels. The `tone` prop switches
 * the accent between the app accent and the preprocessing accent.
 */
withDefaults(
  defineProps<{
    icon?: LucideIcon;
    label: string;
    description?: string;
    checked?: boolean;
    /** Render the checkbox button (default true). Hide it to keep the
     *  checked styling (accent border/background) without the box. */
    showCheckbox?: boolean;
    numberValue?: number;
    numberStep?: number | string;
    numberPlaceholder?: string;
    numberMin?: number | string;
    numberMax?: number | string;
    disabled?: boolean;
    highlighted?: boolean;
    tone?: 'accent' | 'preprocessing';
  }>(),
  {
    icon: undefined,
    description: undefined,
    checked: undefined,
    showCheckbox: true,
    numberValue: undefined,
    numberStep: undefined,
    numberPlaceholder: undefined,
    numberMin: undefined,
    numberMax: undefined,
    tone: 'accent',
  },
);

const emit = defineEmits<{
  toggle: [];
  'update:numberValue': [value: number];
}>();
</script>

<template>
  <div
    class="field-card"
    :class="{
      'field-card--checked': checked && !disabled,
      'field-card--highlighted': highlighted,
      'field-card--disabled': disabled,
      'field-card--preprocessing': tone === 'preprocessing',
    }"
  >
    <div v-if="icon" class="field-card__icon">
      <component :is="icon" class="field-card__icon-glyph" />
    </div>

    <div class="field-card__content">
      <span class="field-card__label" :title="label">{{ label }}</span>
      <span
        v-if="description"
        class="field-card__description"
        :title="description"
      >
        {{ description }}
      </span>
    </div>

    <div v-if="numberValue !== undefined" class="field-card__number">
      <InputNumber
        :model-value="numberValue"
        :step="numberStep"
        :placeholder="numberPlaceholder"
        :min="numberMin"
        :max="numberMax"
        :disabled="disabled"
        @update:model-value="emit('update:numberValue', $event)"
      />
    </div>
    <div v-else-if="$slots.field" class="field-card__field">
      <slot name="field" />
    </div>

    <!-- Extra controls (e.g. segmented toggles), unboxed, before the checkbox -->
    <slot name="controls" />

    <button
      v-if="checked !== undefined && showCheckbox"
      type="button"
      class="field-card__checkbox"
      :class="{ 'field-card__checkbox--checked': checked }"
      :disabled="disabled"
      :aria-pressed="checked"
      @click="emit('toggle')"
    >
      <Check v-if="checked" class="field-card__check-icon" stroke-width="3" />
    </button>
  </div>
</template>

<style scoped>
.field-card {
  --field-accent: var(--color-accent-primary);

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

.field-card--preprocessing {
  --field-accent: var(--color-tab-preprocessing);
}

.field-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open dropdown inside one card would paint under the cards after it.
   While focus is inside (open select, editing number), lift the card. */
.field-card:focus-within {
  position: relative;
  z-index: 20;
}

.field-card--checked {
  background-color: color-mix(
    in srgb,
    var(--field-accent) 8%,
    var(--color-bg-tertiary)
  );
}

.field-card--highlighted {
  background-color: color-mix(
    in srgb,
    var(--field-accent) 12%,
    var(--color-bg-tertiary)
  );
  filter: brightness(1.1);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.field-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* Icon tile (variant style) */
.field-card__icon {
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

.field-card--checked .field-card__icon {
  background-color: color-mix(in srgb, var(--field-accent) 20%, transparent);
  color: var(--field-accent);
}

.field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

/* Label + description */
.field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.field-card--checked .field-card__label {
  color: var(--color-fg-primary);
}

.field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Compact inline number box */
.field-card__number {
  flex-shrink: 0;
  width: 4.5rem;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}

/* Flexible inline box for #field slot content (e.g. text inputs) */
.field-card__field {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}

/* Checkbox */
.field-card__checkbox {
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

.field-card__checkbox:hover:not(:disabled) {
  border-color: var(--color-fg-secondary);
}

.field-card__checkbox--checked {
  border-color: var(--field-accent);
  background-color: var(--field-accent);
}

.field-card__checkbox:disabled {
  opacity: 0.4;
  cursor: default;
}

.field-card__check-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-fg-inverse);
}
</style>
