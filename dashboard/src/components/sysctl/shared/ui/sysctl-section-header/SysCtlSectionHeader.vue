<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';

defineProps<{
  icon: LucideIcon;
  title: string;
}>();
</script>

<template>
  <div class="sysctl-section-header">
    <component :is="icon" class="sysctl-section-header__icon" />
    <span class="sysctl-section-header__title">{{ title }}</span>
  </div>
</template>

<style scoped>
.sysctl-section-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-secondary);
}

.sysctl-section-header__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.sysctl-section-header__title {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
