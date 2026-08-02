<script setup lang="ts">
/**
 * The single mounted player for the whole app, launched from any video
 * surface or playlist row. Never moves in the DOM — it only changes CSS
 * positioning: docked inline over the visible source figure (bare, no
 * chrome), floating as a draggable/resizable popup when no figure is in
 * view, or hidden (visibility, so playback never suspends) when dismissed
 * off-screen or suppressed by the playlist background setting. The bar
 * hosts the playlist add/remove toggle; when the playlist panel is not
 * visible, the title becomes the scrolling now-playing marquee that
 * otherwise lives in the playlist bar.
 */
import { playlistMarqueeVisible } from '@/components/chat/composables/right-panel-view.state';
import { usePlaylistToggle } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-playlist-toggle';
import FloatingMediaBar from '@/components/shared/ui/floating-media-bar/FloatingMediaBar.vue';
import type { ResizeDirection } from '@/components/shared/ui/resize-handle-grid/ResizeHandleGrid.vue';
import ResizeHandleGrid from '@/components/shared/ui/resize-handle-grid/ResizeHandleGrid.vue';
import VideoPlayerSurface from '@/components/shared/ui/video-player-surface/VideoPlayerSurface.vue';

import { useFloatingPlayerHost } from './composables/use-floating-player-host';

const {
  launchedVideo,
  dockedInline,
  dockedStyle,
  dockedClipStyle,
  windowHidden,
  popupStyle,
  embedSrc,
  isDirectVideo,
  isUnembeddable,
  setPlayerElement,
  opacityPercent,
  setOpacity,
  startDrag,
  startResize,
  minimize,
  stop,
} = useFloatingPlayerHost();

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(launchedVideo);

function handleResize(direction: ResizeDirection, event: PointerEvent) {
  startResize(direction, event);
}
</script>

<template>
  <div
    v-if="launchedVideo"
    class="floating-player"
    :class="{
      'floating-player--docked': dockedInline,
      'floating-player--hidden': windowHidden,
    }"
    :style="dockedInline ? { ...dockedStyle, ...dockedClipStyle } : popupStyle"
    data-floating-player
  >
    <template v-if="!dockedInline">
      <FloatingMediaBar
        :title="launchedVideo.title"
        :show-title-marquee="!playlistMarqueeVisible"
        :opacity-percent="opacityPercent"
        :is-in-playlist="isInPlaylist"
        minimize-title="Minimize video"
        close-title="Stop video"
        @drag="startDrag"
        @opacity-input="setOpacity"
        @toggle-playlist="togglePlaylistVideo"
        @minimize="minimize"
        @close="stop"
      />
    </template>

    <div class="floating-player__media">
      <!-- Keyed by URL so swapping the launched video remounts the player
           and the pause wiring re-attaches to the fresh element. -->
      <VideoPlayerSurface
        :video-url="launchedVideo.videoUrl"
        :embed-src="embedSrc"
        :is-direct-video="isDirectVideo"
        :is-unembeddable="isUnembeddable"
        :remount-key="launchedVideo.videoUrl"
        class="floating-player__player"
        @set-player-element="setPlayerElement"
      />
    </div>

    <ResizeHandleGrid v-if="!dockedInline" @resize="handleResize" />
  </div>
</template>

<style scoped>
.floating-player {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-border) 45%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 55%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  box-shadow:
    0 0.5rem 2rem color-mix(in srgb, black 45%, transparent),
    0 0 1.5rem color-mix(in srgb, var(--color-accent-glow) 25%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 6%, transparent);
  transition: border-color 0.2s ease;
  overflow: visible;
}

.floating-player:hover {
  border-color: var(--color-accent-border);
}

/* Docked inline: the player overlays the source figure exactly — bare,
   borderless, flush with the figure's media box (position/size comes from
   the tracked anchor rect). The iframe underneath keeps playing untouched. */
.floating-player--docked {
  width: auto;
  max-width: none;
  border: none;
  background: var(--color-bg-tertiary);
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  box-shadow: none;
}

.floating-player--docked .floating-player__media {
  aspect-ratio: auto;
}

/* Hidden window modes (dismissed off-screen / playlist background mode):
   the player keeps running, only the window is suppressed — visibility
   (not display) so playback is never suspended. */
.floating-player--hidden {
  visibility: hidden;
  pointer-events: none;
}

.floating-player__media {
  position: relative;
  flex: 1;
  min-height: 0;
  aspect-ratio: 16 / 9;
  background: color-mix(in srgb, var(--color-bg-tertiary) 60%, transparent);
  overflow: hidden;
}

.floating-player__player {
  display: block;
  width: 100%;
  height: 100%;
}

.floating-player__media :deep(.video-player-surface__fallback) {
  position: absolute;
  inset: 0;
}
</style>
