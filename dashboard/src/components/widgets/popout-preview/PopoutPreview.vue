<script setup lang="ts">
/**
 * Example floating popup shown from SysCtl → Widgets: renders the real
 * standalone FloatingPopout at the configured initial anchor, so the
 * position setting can be previewed with the actual popup chrome (title,
 * opacity slider, playlist toggle, minimize, close). A lightweight preview
 * only — minimize and close both hide it, and it is not draggable.
 */
import { PictureInPicture2 } from '@lucide/vue';
import { computed } from 'vue';

import FloatingPopout from '@/components/shared/ui/floating-popout/FloatingPopout.vue';

import {
  hidePopoutPreview,
  popoutAnchor,
  popoutPreviewVisible,
} from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import { ANCHOR_STYLES } from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-popup-geometry';

const anchorStyle = computed(() => ANCHOR_STYLES[popoutAnchor.value]);
</script>

<template>
  <FloatingPopout
    v-if="popoutPreviewVisible"
    class="popout-preview"
    :style="anchorStyle"
    title="Example popout"
    :opacity-percent="100"
    :is-in-playlist="false"
    minimize-title="Minimize preview"
    close-title="Close preview"
    @minimize="hidePopoutPreview"
    @close="hidePopoutPreview"
  >
    <div class="popout-preview__media">
      <PictureInPicture2 class="popout-preview__media-icon" />
      <span class="popout-preview__media-label">video preview</span>
    </div>
  </FloatingPopout>
</template>

<style scoped>
.popout-preview__media {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  color: var(--color-fg-muted);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 5%,
    var(--color-bg-primary)
  );
}

.popout-preview__media-icon {
  width: 2rem;
  height: 2rem;
}

.popout-preview__media-label {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
