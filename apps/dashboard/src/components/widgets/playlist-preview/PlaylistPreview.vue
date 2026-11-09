<script setup lang="ts">
/**
 * Example floating playlist shown from Settings → Widgets: renders a
 * lookalike playlist window at the configured anchor, so the position and
 * look can be previewed. It is a fully separate, non-interactive instance —
 * the toolbar's actions are no-ops and no playlist state is read or
 * written, so the real floating playlist is unaffected.
 *
 * Window-styled like the real floating playlist (frosted glass at the
 * anchor) but deliberately NOT the shared panel: the real PlaylistPanel is
 * store-coupled, so the preview composes its own inert shell from the
 * shared building blocks (transport bar, empty state) with fixed values.
 */
import { X } from '@lucide/vue';
import { computed } from 'vue';

import PlaylistTransportBar from '@/components/chat/chat-right-toolbar/playlist/playlist-transport-bar/PlaylistTransportBar.vue';
import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';

import { useFloatingPlaylistGeometry } from '../floating-playlist/composables/use-floating-playlist-geometry';
import { useWidgetPreview } from '../shared/composables/use-widget-preview';

const { playlistPreviewVisible, hideWidgetPreview } = useWidgetPreview();

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
      class="playlist-preview__window"
      :aria-label="$t('common.floatingPlayerPreview')"
    >
      <div class="playlist-preview__top">
        <div class="playlist-preview__toolbar">
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
            <span class="playlist-preview__active-name">{{
              $t('common.example')
            }}</span>
          </Tooltip>
          <IconButton
            size="sm"
            :title="$t('common.closePreview')"
            @click="hideWidgetPreview"
          >
            <X />
          </IconButton>
        </div>
      </div>

      <div class="playlist-preview__body">
        <PanelEmptyState
          :message="$t('common.noVideosInPlaylist')"
          :submessage="$t('common.floatingPlayerPositionHint')"
        />
      </div>
    </aside>
  </div>
</template>

<style scoped>
/* Mirrors the real floating playlist's window chrome so the preview looks
   identical: fixed at the configured anchor, frosted glass, no frame. */
.playlist-preview {
  position: fixed;
  z-index: 1200;
  width: 18rem;
  max-width: calc(100vw - 2rem);
  pointer-events: auto;
}

.playlist-preview__window {
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

.playlist-preview__top {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-1) var(--spacing-1-5);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  user-select: none;
}

.playlist-preview__toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.playlist-preview__toolbar > :first-child {
  flex: 1;
  min-width: 0;
}

.playlist-preview__active-name {
  flex-shrink: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.playlist-preview__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
