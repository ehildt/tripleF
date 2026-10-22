<script setup lang="ts">
/**
 * One toast in the toast stack: the type-tinted side bar and icon, the
 * message, and its action buttons — pin (freeze the countdown; only with
 * pinning enabled in settings), "don't show again" (only for keyed,
 * mutable message kinds), and close. Pure presentation: all actions emit
 * upward; the container binds them with the toast id.
 */
import type { LucideIcon } from '@lucide/vue';
import {
  BellOff,
  Bug,
  Check,
  CircleX,
  Info,
  Pin,
  PinOff,
  TriangleAlert,
  X,
} from '@lucide/vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import type { ToastType } from '@/types/toast-type.model';

import type { ToastItemEmits, ToastItemProps } from './ToastItem.types';

/** Toast severity → side bar and icon (exhaustive — a new type fails to compile). */
const ICON_MAP: Record<ToastType, LucideIcon> = {
  success: Check,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
  debug: Bug,
  default: Info,
};

defineProps<ToastItemProps>();
const emit = defineEmits<ToastItemEmits>();
</script>

<template>
  <div
    class="toast-item shadow-floating"
    @mouseenter="emit('pause')"
    @mouseleave="emit('resume')"
  >
    <div class="toast-item__bar" :class="`toast-item__bar--${toast.type}`" />
    <component
      :is="ICON_MAP[toast.type]"
      class="toast-item__icon"
      :class="`toast-item__icon--${toast.type}`"
    />
    <span class="toast-item__message">{{ toast.message }}</span>
    <IconButton
      v-if="pinEnabled"
      size="sm"
      :active="toast.pinned"
      :aria-label="toast.pinned ? $t('common.unpin') : $t('common.pin')"
      :aria-pressed="toast.pinned"
      @click="emit('togglePin')"
    >
      <PinOff v-if="toast.pinned" />
      <Pin v-if="!toast.pinned" />
    </IconButton>
    <IconButton
      v-if="toast.key"
      size="sm"
      :title="$t('common.dontShowAgain')"
      @click="emit('mute')"
    >
      <BellOff />
    </IconButton>
    <IconButton
      size="sm"
      :aria-label="$t('common.close')"
      @click="emit('remove')"
    >
      <X />
    </IconButton>
  </div>
</template>

<style scoped>
.toast-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  min-width: 300px;
  max-width: 420px;
  padding: var(--spacing-3);
  font-size: 0.875rem;
  font-family: var(--font-mono);
  color: var(--color-fg-primary);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.toast-item__bar {
  width: 2px;
  align-self: stretch;
  flex-shrink: 0;
}

.toast-item__bar--success {
  background-color: var(--color-status-success);
}

.toast-item__bar--error {
  background-color: var(--color-status-error);
}

.toast-item__bar--warning {
  background-color: var(--color-status-warning);
}

.toast-item__bar--info,
.toast-item__bar--default {
  background-color: var(--color-status-info);
}

.toast-item__bar--debug {
  background-color: var(--color-tab-debug);
}

.toast-item__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast-item__icon--success {
  color: var(--color-status-success);
}

.toast-item__icon--error {
  color: var(--color-status-error);
}

.toast-item__icon--warning {
  color: var(--color-status-warning);
}

.toast-item__icon--info,
.toast-item__icon--default {
  color: var(--color-status-info);
}

.toast-item__icon--debug {
  color: var(--color-tab-debug);
}

.toast-item__message {
  flex: 1;
  min-width: 0;
  user-select: text;
}
</style>
