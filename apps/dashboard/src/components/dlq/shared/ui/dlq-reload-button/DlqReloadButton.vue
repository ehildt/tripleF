<script setup lang="ts">
import { RefreshCw } from '@lucide/vue';

import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import type { DlqReloadButtonProps } from './DlqReloadButton.types';

defineProps<DlqReloadButtonProps>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();
</script>

<template>
  <div class="dlq-reload-button">
    <Tooltip :text="$t('common.reload')">
      <button
        class="dlq-reload-button__trigger"
        :disabled="loading"
        :aria-busy="loading"
        @click="emit('click')"
      >
        <MotionIcon>
          <RefreshCw
            class="dlq-reload-button__icon"
            :class="{ 'dlq-reload-button__icon--loading': loading }"
          />
        </MotionIcon>
      </button>
    </Tooltip>
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

.dlq-reload-button__trigger:hover:not(:disabled) {
  color: var(--color-fg-primary);
}

.dlq-reload-button__trigger:disabled {
  cursor: default;
}

.dlq-reload-button__icon {
  width: var(--spacing-4);
  height: var(--spacing-4);
}

.dlq-reload-button__icon--loading {
  animation: dlq-reload-button-pulse 1.6s ease-in-out infinite;
}

@keyframes dlq-reload-button-pulse {
  0%,
  100% {
    color: var(--color-fg-muted);
    opacity: 0.65;
    transform: scale(0.92);
  }
  50% {
    color: var(--color-accent-primary);
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .dlq-reload-button__icon--loading {
    animation: none;
  }
}
</style>
