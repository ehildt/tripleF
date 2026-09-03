<script setup lang="ts">
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
import { computed } from 'vue';

import {
  type ToastType,
  useToastState,
} from '../../../../composables/toast-state';
import IconButton from '../../../shared/ui/icon-button/IconButton.vue';
import {
  toastAnchor,
  toastPinEnabled,
} from '../composables/toast-settings.state';

const { toasts, remove, pause, resume, togglePin, muteToast } = useToastState();

const iconMap: Record<ToastType, LucideIcon> = {
  success: Check,
  error: CircleX,
  warning: TriangleAlert,
  info: Info,
  debug: Bug,
  default: Info,
};

const anchorVertical = computed(() => toastAnchor.value.split('-')[0]);
const anchorHorizontal = computed(() => toastAnchor.value.split('-')[1]);
</script>

<template>
  <Teleport to="body">
    <div
      class="toast-container"
      :class="[
        `toast-container--${anchorVertical}`,
        `toast-container--${anchorHorizontal}`,
      ]"
      role="region"
      :aria-label="$t('common.notifications')"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="toast shadow-floating"
        @mouseenter="pause(t.id)"
        @mouseleave="resume(t.id)"
      >
        <div class="toast__bar" :class="`toast__bar--${t.type}`" />
        <component
          :is="iconMap[t.type]"
          class="toast__icon"
          :class="`toast__icon--${t.type}`"
        />
        <span class="toast__message">{{ t.message }}</span>
        <IconButton
          v-if="toastPinEnabled"
          size="sm"
          :active="t.pinned"
          :aria-label="t.pinned ? $t('common.unpin') : $t('common.pin')"
          :aria-pressed="t.pinned"
          @click="togglePin(t.id)"
        >
          <PinOff v-if="t.pinned" />
          <Pin v-else />
        </IconButton>
        <IconButton
          v-if="t.key"
          size="sm"
          :title="$t('common.dontShowAgain')"
          @click="muteToast(t.id)"
        >
          <BellOff />
        </IconButton>
        <IconButton
          size="sm"
          :aria-label="$t('common.close')"
          @click="remove(t.id)"
        >
          <X />
        </IconButton>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-container {
  position: fixed;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* Newest toast lands nearest the screen edge: top anchors flip the stack.
   All edges use the same symmetric inset so an anchored stack sits the
   same distance from its two adjacent screen edges. */
.toast-container--top {
  top: 3rem;
  flex-direction: column-reverse;
}

.toast-container--middle {
  top: 50%;
  translate: 0 -50%;
}

.toast-container--bottom {
  bottom: 3rem;
}

.toast-container--left {
  left: 3rem;
  align-items: flex-start;
}

.toast-container--center {
  left: 50%;
  translate: -50% 0;
}

.toast-container--middle.toast-container--center {
  translate: -50% -50%;
}

.toast-container--right {
  right: 3rem;
  align-items: flex-end;
}

.toast {
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

.toast__bar {
  width: 2px;
  align-self: stretch;
  flex-shrink: 0;
}

.toast__bar--success {
  background-color: var(--color-status-success);
}

.toast__bar--error {
  background-color: var(--color-status-error);
}

.toast__bar--warning {
  background-color: var(--color-status-warning);
}

.toast__bar--info,
.toast__bar--default {
  background-color: var(--color-status-info);
}

.toast__bar--debug {
  background-color: var(--color-tab-debug);
}

.toast__icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.toast__icon--success {
  color: var(--color-status-success);
}

.toast__icon--error {
  color: var(--color-status-error);
}

.toast__icon--warning {
  color: var(--color-status-warning);
}

.toast__icon--info,
.toast__icon--default {
  color: var(--color-status-info);
}

.toast__icon--debug {
  color: var(--color-tab-debug);
}

.toast__message {
  flex: 1;
  min-width: 0;
  user-select: text;
}
</style>
