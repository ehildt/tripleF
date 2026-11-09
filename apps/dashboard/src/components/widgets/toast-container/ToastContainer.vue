<script setup lang="ts">
/**
 * The on-screen toast stack, teleported to the document body and anchored
 * per the toast settings (Settings → Widgets). Renders each queued toast
 * as a ToastItem and binds the store's queue actions with the toast id.
 * Orchestrator-thin: store wiring plus the anchor composable; all toast
 * rendering lives in ToastItem.
 */
import { useToastQueue } from '@/composables/use-toast-queue/use-toast-queue';
import { useToastSettingsStore } from '@/stores/widgets/toast-settings/toast-settings.store';

import { useToastAnchor } from './composables/use-toast-anchor';
import ToastItem from './toast-item/ToastItem.vue';

const { toasts, remove, pause, resume, togglePin, muteToast } = useToastQueue();
const toastSettingsStore = useToastSettingsStore();

const { anchorVertical, anchorHorizontal } = useToastAnchor();
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
      <ToastItem
        v-for="t in toasts"
        :key="t.id"
        :toast="t"
        :pin-enabled="toastSettingsStore.toastPinEnabled"
        @pause="pause(t.id)"
        @resume="resume(t.id)"
        @toggle-pin="togglePin(t.id)"
        @mute="muteToast(t.id)"
        @remove="remove(t.id)"
      />
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
</style>
