<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';

import ChatPendingIndicator from '../../../../chat/pending-indicator/ChatPendingIndicator.vue';

defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <div class="dlq-reload-button">
    <Transition name="fade">
      <button
        v-if="!loading"
        key="reload"
        class="dlq-reload-button__trigger"
        @click="emit('click')"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
      <div v-else key="loading" class="dlq-reload-button__indicator">
        <ChatPendingIndicator />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.dlq-reload-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  width: 1.625rem;
  height: 1.625rem;
}

.dlq-reload-button__trigger {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.dlq-reload-button__trigger:hover {
  color: var(--color-fg-primary);
}

.dlq-reload-button__indicator {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
