<script setup lang="ts">
/**
 * Example floating popup shown from SysCtl → Widgets: a lightweight
 * placeholder that mimics the real floating player's frame at the
 * configured initial anchor, so the position setting can be previewed
 * without launching a video.
 */
import { GripVertical, PictureInPicture2 } from '@lucide/vue';
import { computed } from 'vue';

import {
  hidePopoutPreview,
  popoutAnchor,
  popoutPreviewVisible,
} from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import { ANCHOR_STYLES } from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-popup-geometry';

const anchorStyle = computed(() => ANCHOR_STYLES[popoutAnchor.value]);
</script>

<template>
  <Teleport to="body">
    <div
      v-if="popoutPreviewVisible"
      class="popout-preview shadow-floating"
      :style="anchorStyle"
    >
      <div class="popout-preview__bar">
        <GripVertical class="popout-preview__grip" aria-hidden="true" />
        <span class="popout-preview__title">Example popout</span>
        <button
          type="button"
          class="popout-preview__close"
          aria-label="Close preview"
          title="Close preview"
          @click="hidePopoutPreview"
        >
          ✕
        </button>
      </div>

      <div class="popout-preview__media">
        <PictureInPicture2 class="popout-preview__media-icon" />
        <span class="popout-preview__media-label">video preview</span>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.popout-preview {
  position: fixed;
  z-index: 1000;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.popout-preview__bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-1) var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
}

.popout-preview__grip {
  width: 0.9rem;
  height: 0.9rem;
  flex-shrink: 0;
  color: var(--color-fg-muted);
}

.popout-preview__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-secondary);
}

.popout-preview__close {
  flex-shrink: 0;
  width: 0.75rem;
  height: 0.75rem;
  font-size: 0.75rem;
  line-height: 1;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.popout-preview__close:hover {
  color: var(--color-fg-primary);
}

.popout-preview__media {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  aspect-ratio: 16 / 9;
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
