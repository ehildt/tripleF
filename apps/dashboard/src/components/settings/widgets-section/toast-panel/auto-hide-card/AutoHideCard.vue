<script setup lang="ts">
import { Check } from '@lucide/vue';

import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type {
  AutoHideCardEmits,
  AutoHideCardProps,
} from './AutoHideCard.types';

/**
 * The toast auto-hide row: icon tile, label + description, then the on/off
 * checkbox followed by its seconds stepper. Unlike NumberFieldCard — whose
 * checkbox always renders last — this card deliberately leads with the
 * checkbox: it gates the stepper next to it (seconds are editable only
 * while auto-hide is on).
 */
withDefaults(defineProps<AutoHideCardProps>(), {
  disabled: false,
});

const emit = defineEmits<AutoHideCardEmits>();
</script>

<template>
  <div
    class="auto-hide-card"
    :class="{
      'auto-hide-card--checked': checked && !disabled,
      'auto-hide-card--disabled': disabled,
    }"
  >
    <div class="auto-hide-card__icon">
      <component :is="icon" class="auto-hide-card__icon-glyph" />
    </div>

    <div class="auto-hide-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="auto-hide-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="auto-hide-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <button
      type="button"
      class="auto-hide-card__checkbox"
      :class="{ 'auto-hide-card__checkbox--checked': checked }"
      :disabled="disabled"
      :aria-pressed="checked"
      :aria-label="checkboxAriaLabel"
      @click="emit('toggle')"
    >
      <Check
        v-if="checked"
        class="auto-hide-card__check-icon"
        stroke-width="3"
      />
    </button>
    <div class="auto-hide-card__number">
      <InputNumber
        :model-value="seconds"
        :min="1"
        :max="30"
        :step="0.5"
        :disabled="!checked || disabled"
        @update:model-value="emit('update:seconds', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.auto-hide-card {
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

.auto-hide-card:hover {
  filter: brightness(1.08);
}

.auto-hide-card:focus-within {
  position: relative;
  z-index: 20;
}

.auto-hide-card--checked {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 8%,
    var(--color-bg-tertiary)
  );
}

.auto-hide-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.auto-hide-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.auto-hide-card--checked .auto-hide-card__icon {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 20%,
    transparent
  );
  color: var(--color-accent-primary);
}

.auto-hide-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.auto-hide-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.auto-hide-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auto-hide-card--checked .auto-hide-card__label {
  color: var(--color-fg-primary);
}

.auto-hide-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Leading checkbox (before the stepper, unlike NumberFieldCard) */
.auto-hide-card__checkbox {
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

.auto-hide-card__checkbox:hover:not(:disabled) {
  border-color: var(--color-fg-secondary);
}

.auto-hide-card__checkbox--checked {
  border-color: var(--color-accent-primary);
  background-color: var(--color-accent-primary);
}

.auto-hide-card__checkbox:disabled {
  opacity: 0.4;
  cursor: default;
}

.auto-hide-card__check-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-fg-inverse);
}

/* Compact inline number box */
.auto-hide-card__number {
  flex-shrink: 0;
  width: 4.5rem;
  padding: 0 var(--spacing-1);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
}
</style>
