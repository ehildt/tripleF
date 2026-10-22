<script setup lang="ts">
/**
 * Shared header for the memory spaces: the panel identity (icon tile,
 * label, description) plus an actions region. Pure presentational chrome —
 * the icon/label/description arrive as flat props and the actions slot is
 * the one channel for the caller's toolbar components.
 */
import type { SpaceHeaderProps } from './SpaceHeader.types';

defineProps<SpaceHeaderProps>();
</script>

<template>
  <div class="space-header">
    <div class="space-header__icon">
      <component :is="icon" class="space-header__icon-glyph" />
    </div>
    <div class="space-header__content">
      <span class="space-header__label">{{ label }}</span>
      <span class="space-header__description">{{ description }}</span>
    </div>
    <div class="space-header__actions">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.space-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-tertiary);
}

.space-header__icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  background-color: color-mix(in srgb, var(--color-fg-muted) 10%, transparent);
  color: var(--color-fg-muted);
}

.space-header__icon-glyph {
  width: 1rem;
  height: 1rem;
}

.space-header__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.space-header__label {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--color-fg-secondary);
  overflow-wrap: anywhere;
}

.space-header__description {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.4;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.space-header__actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  flex-shrink: 0;
}
</style>
