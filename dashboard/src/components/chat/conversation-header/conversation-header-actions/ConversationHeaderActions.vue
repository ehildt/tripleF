<script setup lang="ts">
import {
  LoaderCircle,
  PenLine,
  Pin,
  PinOff,
  Shrink,
  Trash2,
} from '@lucide/vue';

import MotionIcon from '../../../shared/ui/motion-icon/MotionIcon.vue';

defineProps<{
  conversationType: 'temporary' | 'persistent';
  compacting: boolean;
}>();

const emit = defineEmits<{
  (e: 'rename'): void;
  (e: 'delete'): void;
  (e: 'toggleType'): void;
  (e: 'compact'): void;
}>();
</script>

<template>
  <div class="conversation-header-actions">
    <button
      type="button"
      class="conversation-header-actions__button"
      title="Rename"
      @click="emit('rename')"
    >
      <MotionIcon
        ><PenLine class="conversation-header-actions__icon"
      /></MotionIcon>
    </button>

    <button
      type="button"
      class="conversation-header-actions__button conversation-header-actions__button--danger"
      title="Delete conversation"
      @click="emit('delete')"
    >
      <MotionIcon
        ><Trash2 class="conversation-header-actions__icon"
      /></MotionIcon>
    </button>

    <button
      type="button"
      class="conversation-header-actions__button"
      :title="
        conversationType === 'temporary'
          ? 'Pin to persistent'
          : 'Unpin to temporary'
      "
      @click="emit('toggleType')"
    >
      <MotionIcon>
        <PinOff
          v-if="conversationType === 'temporary'"
          class="conversation-header-actions__icon"
        />
        <Pin v-else class="conversation-header-actions__icon" />
      </MotionIcon>
    </button>

    <button
      type="button"
      class="conversation-header-actions__button"
      :class="{
        'conversation-header-actions__button--disabled': compacting,
      }"
      :title="compacting ? 'Compacting...' : 'Compact'"
      :disabled="compacting"
      @click="emit('compact')"
    >
      <MotionIcon>
        <LoaderCircle
          v-if="compacting"
          class="conversation-header-actions__icon conversation-header-actions__icon--spin"
        />
        <Shrink v-else class="conversation-header-actions__icon" />
      </MotionIcon>
    </button>
  </div>
</template>

<style scoped>
.conversation-header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
}

.conversation-header-actions__button {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.conversation-header-actions__button:hover:not(:disabled) {
  color: var(--color-tab-rest);
}

.conversation-header-actions__button--danger:hover:not(:disabled) {
  color: var(--color-status-error);
}

.conversation-header-actions__button--disabled,
.conversation-header-actions__button--disabled:hover {
  color: var(--color-fg-muted);
  cursor: default;
}

.conversation-header-actions__icon {
  width: 0.875rem;
  height: 0.875rem;
}

.conversation-header-actions__icon--spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
