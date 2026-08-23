<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';

import ChatPendingIndicator from '../../../../chat/pending-indicator/ChatPendingIndicator.vue';
import MotionIcon from '../../../../shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '../../../../shared/ui/tooltip/Tooltip.vue';

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
      <Tooltip v-if="!loading" :text="$t('common.reload')">
        <button
          key="reload"
          class="dlq-reload-button__trigger"
          @click="emit('click')"
        >
          <MotionIcon><RefreshCw class="w-4 h-4" /></MotionIcon>
        </button>
      </Tooltip>
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
  width: 1.5rem;
  height: 1.5rem;
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
