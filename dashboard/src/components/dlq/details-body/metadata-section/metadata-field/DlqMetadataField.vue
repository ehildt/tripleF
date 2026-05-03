<script setup lang="ts">
import type { Component } from 'vue';

defineProps<{
  icon: Component;
  label: string;
  value: string;
}>();
</script>

<template>
  <div class="dlq-metadata-field">
    <component :is="icon" class="dlq-metadata-field__icon" />
    <span class="dlq-metadata-field__label">{{ label }}</span>
    <span class="dlq-metadata-field__value">{{ value }}</span>
  </div>
</template>

<style scoped>
.dlq-metadata-field {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.dlq-metadata-field__icon {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--color-fg-muted);
}

.dlq-metadata-field__label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  text-transform: uppercase;
  width: 5rem;
}

.dlq-metadata-field__value {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-primary);
}
</style>
