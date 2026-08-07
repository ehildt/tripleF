<script setup lang="ts">
/**
 * Example floating player shown from SysCtl → Widgets: renders the actual
 * floating-player window chrome (same toolbar + empty-state body) at the
 * configured anchor, so the position and look can be previewed. It is a
 * fully separate, non-interactive instance — the toolbar's actions are
 * no-ops and no playlist state is read or written, so the real floating
 * player is unaffected.
 */
import { X } from '@lucide/vue';
import { computed } from 'vue';

import PlaylistTransportBar from '@/components/chat/right-panel/playlist-transport-bar/PlaylistTransportBar.vue';
import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import {
  hidePlaylistPreview,
  playlistPreviewVisible,
} from '../floating-playlist/composables/playlist-settings.state';
import { useFloatingPlaylistGeometry } from '../floating-playlist/composables/use-floating-playlist-geometry';

const { playlistStyle } = useFloatingPlaylistGeometry();

const previewStyle = computed(() => ({ ...playlistStyle.value }));

function noop() {
  /* preview is non-interactive */
}
</script>

<template>
  <div
    v-if="playlistPreviewVisible"
    class="playlist-preview shadow-floating"
    data-playlist-preview
    :style="previewStyle"
  >
    <aside
      class="floating-playlist"
      :aria-label="$t('common.floatingPlayerPreview')"
    >
      <div class="floating-playlist__top">
        <div class="floating-playlist__toolbar">
          <PlaylistTransportBar
            :playing="false"
            :can-toggle-playback="false"
            :playback-toggle-title="$t('common.playPreview')"
            :has-active-playback="false"
            :autoplay-enabled="false"
            :popout-hidden="false"
            :show-now-playing="false"
            @toggle-playback="noop"
            @stop-playback="noop"
            @toggle-autoplay="noop"
            @toggle-popout-visibility="noop"
          />
          <Tooltip
            :text="$t('common.activePlaylist', { name: $t('common.example') })"
          >
            <span class="floating-playlist__active-name">{{
              $t('common.example')
            }}</span>
          </Tooltip>
          <Tooltip :text="$t('common.closePreview')">
            <button
              type="button"
              class="floating-playlist__toggle"
              :aria-label="$t('common.closePreview')"
              @click="hidePlaylistPreview"
            >
              <X class="floating-playlist__toggle-icon" />
            </button>
          </Tooltip>
        </div>
      </div>

      <div class="floating-playlist__body">
        <PanelEmptyState
          :message="$t('common.noVideosInPlaylist')"
          sub:message="$t('common.floatingPlayerPositionHint')"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Mirrors the real floating player's window chrome so the preview looks
   identical: fixed at the configured anchor, frosted glass, no frame. */
.playlist-preview {
  position: fixed;
  z-index: 1200;
  width: 18rem;
  max-width: calc(100vw - 2rem);
  pointer-events: auto;
}

.floating-playlist {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 8rem);
  background-color: color-mix(
    in srgb,
    var(--color-bg-secondary) 50%,
    transparent
  );
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  clip-path: inset(-16rem);
}

.floating-playlist__top {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  user-select: none;
}

.floating-playlist__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.floating-playlist__toolbar > :first-child {
  flex: 1;
  min-width: 0;
}

.floating-playlist__active-name {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.floating-playlist__toggle {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-1) var(--spacing-2);
  border: none;
  background-color: transparent;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.floating-playlist__toggle:hover {
  color: var(--color-accent-primary);
}

.floating-playlist__toggle-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.floating-playlist__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
