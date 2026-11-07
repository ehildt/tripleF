<script lang="ts" setup>
import type { PanelHeaderTitleProps } from './PanelHeaderTitle.types';

defineProps<PanelHeaderTitleProps>();
</script>

<template>
  <div class="panel-header-title">
    <span class="panel-header-title__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.panel-header-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-family: var(--font-mono);
}

.panel-header-title__label {
  font-size: 0.75rem;
  line-height: 1rem;
  color: var(--color-accent-primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
