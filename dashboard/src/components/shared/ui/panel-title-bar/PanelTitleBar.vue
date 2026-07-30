<script setup lang="ts">
import { ChevronRight } from '@lucide/vue';

defineProps<{
  title: string;
  count?: number;
}>();
</script>

<template>
  <div class="panel-title-bar">
    <slot name="icon">
      <ChevronRight class="panel-title-bar__icon" />
    </slot>
    <span class="panel-title-bar__title">{{ title }}</span>
    <span
      v-if="count !== undefined && count > 0"
      class="panel-title-bar__count"
    >
      [{{ count }}]
    </span>
    <div class="panel-title-bar__spacer" />
    <slot name="actions" />
  </div>
</template>

<style scoped>
.panel-title-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  font-family: var(--font-mono);
}

.panel-title-bar__icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-tab-rest);
  flex-shrink: 0;
}

.panel-title-bar__title {
  font-size: 0.875rem;
  color: var(--color-tab-rest);
}

.panel-title-bar__count {
  font-size: 0.75rem;
  color: var(--color-tab-rest);
}

.panel-title-bar__spacer {
  flex: 1;
}
</style>
