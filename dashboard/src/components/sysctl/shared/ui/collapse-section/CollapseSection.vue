<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue';
import { ChevronDown, ChevronRight } from '@lucide/vue';

defineProps<{
  icon: LucideIcon;
  title: string;
  open: boolean;
}>();

const emit = defineEmits<{
  toggle: [];
}>();
</script>

<template>
  <div class="collapse-section">
    <button
      type="button"
      class="collapse-section__trigger"
      @click="emit('toggle')"
    >
      <ChevronRight v-if="!open" class="collapse-section__chevron" />
      <ChevronDown v-else class="collapse-section__chevron" />
      <component :is="icon" class="collapse-section__icon" />
      <span class="collapse-section__title">{{ title }}</span>
    </button>
    <div v-if="open" class="collapse-section__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.collapse-section {
  border-bottom: 1px solid var(--color-divider);
}

.collapse-section__trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  text-align: left;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
  background-color: transparent;
  border: none;
  cursor: pointer;
  transition: background-color 200ms ease;
}

.collapse-section__trigger:hover {
  background-color: var(--color-bg-tertiary);
}

.collapse-section__chevron {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-tab-rest);
  flex-shrink: 0;
}

.collapse-section__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.collapse-section__title {
  font-weight: 600;
}

.collapse-section__content {
  padding: var(--spacing-1) 0 var(--spacing-3);
}

.collapse-section__content > *:last-child {
  border-bottom: none;
}
</style>
