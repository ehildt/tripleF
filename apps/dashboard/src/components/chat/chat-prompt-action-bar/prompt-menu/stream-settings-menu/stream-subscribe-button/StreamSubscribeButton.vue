<script setup lang="ts">
import type { StreamSubscribeButtonProps } from './StreamSubscribeButton.types';

defineProps<StreamSubscribeButtonProps>();

const emit = defineEmits<{
  subscribe: [];
}>();
</script>

<template>
  <button
    type="button"
    class="stream-subscribe-button"
    :class="
      canSubscribe
        ? 'stream-subscribe-button--enabled'
        : 'stream-subscribe-button--disabled'
    "
    :disabled="!canSubscribe"
    @click.stop="emit('subscribe')"
  >
    {{ $t('common.subscribe') }}
  </button>
</template>

<style scoped>
.stream-subscribe-button {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.stream-subscribe-button--enabled {
  color: var(--color-fg-inverse);
  background-color: var(--color-accent-primary);
  cursor: pointer;
}

.stream-subscribe-button--enabled:hover {
  opacity: 0.9;
}

.stream-subscribe-button--disabled {
  color: var(--color-fg-muted);
  background-color: var(--color-bg-tertiary);
  cursor: default;
}
</style>
