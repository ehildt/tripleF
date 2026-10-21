<script setup lang="ts">
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import SpaceSelector from '../../../system-section/space-selector/SpaceSelector.vue';
import type { SpaceSelectorCardProps } from './SpaceSelectorCard.types';

/**
 * Full-width memory setting row carrying the cognition-space picker: icon
 * tile, label + description, and a SpaceSelector as the inline control
 * (borderless trigger, teleported dropdown). Space events arrive as plain
 * callbacks (`onSelect` / `onCreate` / `onRemove`) — the card owns no state.
 */
defineProps<SpaceSelectorCardProps>();
</script>

<template>
  <div class="space-selector-card">
    <div class="space-selector-card__icon">
      <component :is="icon" class="space-selector-card__icon-glyph" />
    </div>

    <div class="space-selector-card__content">
      <Tooltip :text="label" max-width="16rem">
        <span class="space-selector-card__label">{{ label }}</span>
      </Tooltip>
      <Tooltip v-if="description" :text="description" max-width="20rem">
        <span class="space-selector-card__description">{{ description }}</span>
      </Tooltip>
    </div>

    <div class="space-selector-card__field">
      <SpaceSelector
        :spaces="spaces"
        :active-space="activeSpace"
        @select="onSelect"
        @create="onCreate"
        @remove="onRemove"
      />
    </div>
  </div>
</template>

<style scoped>
.space-selector-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
  transition:
    background-color 0.2s ease,
    filter 0.2s ease;
}

.space-selector-card:hover {
  filter: brightness(1.08);
}

/* The hover filter above makes every card its own stacking context — an
   open dropdown inside one card would paint under the cards after it.
   While focus is inside (open picker), lift the card. */
.space-selector-card:focus-within {
  position: relative;
  z-index: 20;
}

.space-selector-card__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.space-selector-card__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.space-selector-card__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.space-selector-card__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.space-selector-card__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Inline box — the card background is the trigger's frame */
.space-selector-card__field {
  flex: 1;
  min-width: 0;
  padding: 0 var(--spacing-1);
  background-color: var(--color-bg-secondary);
}
</style>
