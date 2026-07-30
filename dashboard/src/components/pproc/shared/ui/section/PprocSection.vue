<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
  icon: LucideIcon;
  title: string;
}>();
</script>

<template>
  <div class="pproc-section">
    <div class="pproc-section__header">
      <div class="pproc-section__title-wrap">
        <component :is="icon" class="pproc-section__icon" />
        <span class="pproc-section__title">{{ title }}</span>
      </div>
      <slot name="action" />
    </div>
    <slot />
  </div>
</template>

<style scoped>
.pproc-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.pproc-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pproc-section__title-wrap {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
}

.pproc-section__icon {
  width: 1rem;
  height: 1rem;
}

.pproc-section__title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
