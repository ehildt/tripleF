<script setup lang="ts">
import { type Component, computed } from 'vue';

const props = defineProps<{
  icon: Component;
  tint: number;
  visible: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const iconStyle = computed(() => ({
  color: `color-mix(in srgb, var(--color-tab-rest) ${(1 - props.tint) * 100}%, var(--color-tab-accent))`,
}));
</script>

<template>
  <button
    v-if="visible"
    class="dlq-action-icon-button"
    :style="iconStyle"
    @click.stop="emit('click')"
  >
    <component :is="icon" class="dlq-action-icon-button__icon" />
  </button>
</template>

<style scoped>
.dlq-action-icon-button {
  padding: var(--spacing-1-5);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.dlq-action-icon-button:hover {
  opacity: 0.7;
}

.dlq-action-icon-button__icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
