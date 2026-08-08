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
import { popoutShowBarAlways } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';
import { usePlaylistToggle } from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-playlist-toggle';
import FloatingPopout from '@/components/shared/ui/floating-popout/FloatingPopout.vue';
import VideoPlayerSurface from '@/components/shared/ui/video-player-surface/VideoPlayerSurface.vue';
import type { ResizeDirection } from '@/types/resize-direction.model';

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
  <!-- One always-mounted FloatingPopout: it owns the window chrome and
       media box, so the player never remounts when the popup docks inline
       or floats — only the `docked` flag and the root style change.
       Position/size/opacity come from popupStyle or the docked anchor rect;
       hidden suppresses the window via visibility. -->
  <FloatingPopout
    v-if="launchedVideo"
    class="floating-player"
    :class="{ 'floating-player--hidden': windowHidden }"
    :style="dockedInline ? { ...dockedStyle, ...dockedClipStyle } : popupStyle"
    :docked="dockedInline"
    :bar-always-visible="popoutShowBarAlways"
    data-floating-player
    :title="launchedVideo.title"
    :show-title-marquee="!playlistMarqueeVisible"
    :opacity-percent="opacityPercent"
    :is-in-playlist="isInPlaylist"
    minimize-:title="$t('common.minimizeVideo')"
    close-:title="$t('common.stopVideo')"
    @drag="startDrag"
    @opacity-input="setOpacity"
    @toggle-playlist="togglePlaylistVideo"
    @minimize="minimize"
    @close="stop"
    @resize="handleResize"
  >
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
  </FloatingPopout>
</template>

<style scoped>
/* Hidden window modes (dismissed off-screen / playlist background mode):
   the player keeps running, only the window is suppressed — visibility
   (not display) so playback is never suspended. Applies to the popup root,
   which carries this scope id as a child-component root. */
.floating-player--hidden {
  visibility: hidden;
  pointer-events: none;
}

/* Fill the media box in both the docked overlay and the popup slot. */
.floating-player__player {
  display: block;
  flex: 1;
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.floating-player :deep(.video-player-surface__fallback) {
  position: absolute;
  inset: 0;
}
</style>
