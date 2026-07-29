<script setup lang="ts">
/**
 * Standalone floating video popup, launched from the playlist panel. Shares
 * geometry and opacity with the scroll-out float: drag by the bar, resize
 * from any edge or corner, dock with ✕. The bar also hosts the playlist
 * add/remove toggle; when the playlist panel is not visible, the title
 * becomes the scrolling now-playing marquee that otherwise lives in the
 * playlist bar.
 */
import { ListCheck, ListPlus, X } from '@lucide/vue';
import { computed } from 'vue';

import { playlistMarqueeVisible } from '../composables/right-panel-view.state';
import { usePlaylistToggle } from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/use-playlist-toggle';
import { useFloatingPlayerHost } from './composables/use-floating-player-host';

const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

const {
  launchedVideo,
  popupStyle,
  popoutHideOnPlaylist,
  embedSrc,
  isDirectVideo,
  isUnembeddable,
  setPlayerElement,
  opacityPercent,
  setOpacity,
  startDrag,
  startResize,
  close,
} = useFloatingPlayerHost();

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(launchedVideo);

/** Fill the slider track with accent up to the current value. */
const opacitySliderStyle = computed(() => {
  const fillPercent = ((opacityPercent.value - 25) / 75) * 100;
  return {
    background: `linear-gradient(to right, var(--color-accent-primary) ${fillPercent}%, var(--color-bg-tertiary) ${fillPercent}%)`,
  };
});

function onOpacityInput(event: Event) {
  setOpacity(Number((event.target as HTMLInputElement).value));
}
</script>

<template>
  <div
    v-if="launchedVideo"
    class="floating-player"
    :class="{ 'floating-player--hidden': popoutHideOnPlaylist }"
    :style="popupStyle"
    data-floating-player
  >
    <div class="floating-player__bar" @pointerdown="startDrag">
      <!-- While the playlist bar carries the animated now-playing text the
           title stays static; otherwise the popout scrolls it instead. -->
      <span v-if="playlistMarqueeVisible" class="floating-player__title">{{
        launchedVideo.title
      }}</span>
      <div
        v-else
        class="floating-player__title floating-player__title--marquee"
      >
        <div class="floating-player__marquee-track">
          <span class="floating-player__marquee-text">{{
            launchedVideo.title
          }}</span>
          <span class="floating-player__marquee-text" aria-hidden="true">{{
            launchedVideo.title
          }}</span>
        </div>
      </div>
      <div class="floating-player__controls">
        <input
          type="range"
          class="floating-player__opacity-slider"
          min="25"
          max="100"
          step="1"
          :value="opacityPercent"
          :style="opacitySliderStyle"
          :aria-label="`Popup opacity: ${opacityPercent}%`"
          :title="`Opacity: ${opacityPercent}%`"
          @pointerdown.stop
          @input="onOpacityInput"
        />
        <button
          type="button"
          class="floating-player__playlist-toggle"
          :class="{ 'floating-player__playlist-toggle--added': isInPlaylist }"
          :aria-pressed="isInPlaylist"
          :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
          :aria-label="
            isInPlaylist ? 'Remove from playlist' : 'Add to playlist'
          "
          @pointerdown.stop
          @click.stop="togglePlaylistVideo"
        >
          <ListCheck
            v-if="isInPlaylist"
            class="floating-player__playlist-icon"
          />
          <ListPlus v-else class="floating-player__playlist-icon" />
        </button>
        <button
          type="button"
          class="floating-player__close"
          aria-label="Close video"
          title="Close video"
          @pointerdown.stop
          @click.stop="close"
        >
          <X class="floating-player__close-icon" />
        </button>
      </div>
    </div>

    <div class="floating-player__media">
      <!-- Keyed by URL so swapping the launched video remounts the player
           and the pause wiring re-attaches to the fresh element. -->
      <video
        v-if="isDirectVideo"
        :key="launchedVideo.videoUrl"
        :ref="setPlayerElement"
        :src="launchedVideo.videoUrl"
        controls
        autoplay
        class="floating-player__player"
      />
      <iframe
        v-else-if="embedSrc"
        :key="launchedVideo.videoUrl"
        :ref="setPlayerElement"
        :src="embedSrc"
        class="floating-player__player"
        frameborder="0"
        allowfullscreen
        allow="
          accelerometer;
          autoplay;
          clipboard-write;
          encrypted-media;
          gyroscope;
          picture-in-picture;
          compute-pressure *;
        "
      />
      <a
        v-else-if="isUnembeddable"
        :href="launchedVideo.videoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="floating-player__fallback"
      >
        Watch on source ↗
      </a>
    </div>

    <span
      v-for="direction in RESIZE_DIRECTIONS"
      :key="direction"
      class="floating-player__resize"
      :class="`floating-player__resize--${direction}`"
      aria-hidden="true"
      @pointerdown="startResize(direction, $event)"
    />
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
}

.floating-player:hover {
  border-color: var(--color-accent-border);
}

/* Playlist background mode: the player keeps running, only the window is
   suppressed — visibility (not display) so playback is never suspended. */
.floating-player--hidden {
  visibility: hidden;
  pointer-events: none;
}

.floating-player__bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: var(--spacing-0-5) var(--spacing-1-5);
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-divider) 70%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated) 35%, transparent);
  cursor: grab;
  touch-action: none;
  user-select: none;
}

.floating-player__bar:active {
  cursor: grabbing;
}

/* Right-aligned icon cluster with equal gap-1 spacing. */
.floating-player__controls {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.floating-player__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

/* Marquee mode: same seamless loop as the playlist panel — the duplicated
   span makes the wrap from -50% back to 0 invisible. */
.floating-player__title--marquee {
  display: flex;
  align-items: center;
  text-overflow: clip;
}

.floating-player__marquee-track {
  display: inline-flex;
  white-space: nowrap;
  animation: floating-player-scroll 12s linear infinite;
}

.floating-player__marquee-text {
  padding-right: var(--spacing-9\.5);
}

@keyframes floating-player-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .floating-player__marquee-track {
    animation: none;
  }
}

.floating-player__playlist-toggle {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  color: white;
  cursor: pointer;
  background: color-mix(in srgb, black 55%, transparent);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  box-shadow:
    0 0.15rem 0.6rem color-mix(in srgb, black 40%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.floating-player__playlist-toggle:hover {
  color: white;
  background: var(--color-accent-primary);
}

.floating-player__playlist-toggle--added,
.floating-player__playlist-toggle--added:hover {
  color: white;
  background: color-mix(in srgb, var(--color-accent-primary) 85%, transparent);
}

.floating-player__playlist-icon {
  width: 0.75rem;
  height: 0.75rem;
  filter: drop-shadow(0 1px 2px color-mix(in srgb, black 60%, transparent));
}

.floating-player__opacity-slider {
  flex-shrink: 0;
  appearance: none;
  width: 4.5rem;
  height: 0.25rem;
  /* Matches the icon buttons' inner padding so the space between the
     track and the playlist icon equals the space between the icons. */
  margin: 0 var(--spacing-1) 0 0;
  outline: none;
  cursor: pointer;
}

.floating-player__opacity-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.75rem;
  height: 0.75rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
}

.floating-player__opacity-slider::-moz-range-thumb {
  width: 0.55rem;
  height: 0.55rem;
  background-color: var(--color-accent-primary);
  border: 2px solid var(--color-bg-elevated);
  box-shadow: 0 0 0 1px var(--color-accent-border);
}

.floating-player__close {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.1rem;
  height: 1.1rem;
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.floating-player__close-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.floating-player__close:hover {
  color: var(--color-status-error);
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
  border: none;
}

.floating-player__fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-accent-primary);
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
}

/* ---------- resize handles (edges + corners) ---------- */

.floating-player {
  overflow: visible;
}

.floating-player__resize {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.floating-player__resize--n,
.floating-player__resize--s {
  left: 1rem;
  right: 1rem;
  height: 0.5rem;
  cursor: ns-resize;
}

.floating-player__resize--n {
  top: -0.25rem;
}

.floating-player__resize--s {
  bottom: -0.25rem;
}

.floating-player__resize--e,
.floating-player__resize--w {
  top: 1rem;
  bottom: 1rem;
  width: 0.5rem;
  cursor: ew-resize;
}

.floating-player__resize--e {
  right: -0.25rem;
}

.floating-player__resize--w {
  left: -0.25rem;
}

.floating-player__resize--ne,
.floating-player__resize--nw,
.floating-player__resize--se,
.floating-player__resize--sw {
  width: 1rem;
  height: 1rem;
}

.floating-player__resize--ne {
  top: -0.25rem;
  right: -0.25rem;
  cursor: nesw-resize;
}

.floating-player__resize--nw {
  top: -0.25rem;
  left: -0.25rem;
  cursor: nwse-resize;
}

.floating-player__resize--se {
  bottom: -0.25rem;
  right: -0.25rem;
  cursor: nwse-resize;
}

.floating-player__resize--sw {
  bottom: -0.25rem;
  left: -0.25rem;
  cursor: nesw-resize;
}
</style>
