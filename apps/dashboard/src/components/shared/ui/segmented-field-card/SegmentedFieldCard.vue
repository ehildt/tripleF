<script setup lang="ts">
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { SegmentedFieldCardProps } from './SegmentedFieldCard.types';

/**
 * Full-width setting row carrying one or two icon-only segmented toggles:
 * icon tile, label + description, then the toggles inline. Each toggle is
 * an explicit descriptor (options, current value, onSelect handler) passed
 * via the `toggles` prop — the card holds no toggle state of its own.
 */
withDefaults(defineProps<SegmentedFieldCardProps>(), {
  disabled: false,
});
</script>

<template>
  <div
    class="segmented-field-card"
    :class="{ 'segmented-field-card--disabled': disabled }"
  >
    <div class="segmented-field-card__icon">
      <component :is="icon" class="segmented-field-card__icon-glyph" />
    </div>

    <div class="segmented-field-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="segmented-field-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="segmented-field-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div class="segmented-field-card__toggles">
      <SegmentedToggle
        v-for="toggle in toggles"
        :key="toggle.key"
        :options="toggle.options"
        :model-value="toggle.value"
        :aria-label="toggle.ariaLabel"
        @update:model-value="toggle.onSelect"
      />
    </div>
  </div>
</template>

<style scoped>
.segmented-field-card {
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

.segmented-field-card:hover {
  filter: brightness(1.08);
}

.segmented-field-card--disabled {
  opacity: 0.6;
  pointer-events: none;
}

.segmented-field-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.segmented-field-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.segmented-field-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.segmented-field-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segmented-field-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.segmented-field-card__toggles {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
