<script setup lang="ts">
/**
 * Shared section header for the settings and preprocessing panels: a small
 * mono uppercase title next to its lucide icon. Used by every settings
 * section in Settings and the tools panel.
 */
import type { SectionHeaderProps } from './SectionHeader.types';

defineProps<SectionHeaderProps>();
</script>

<template>
  <div class="section-header">
    <component :is="icon" class="section-header__icon" />
    <span class="section-header__title">{{ title }}</span>
  </div>
</template>

<style scoped>
.section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
}

.section-header__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.section-header__title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
