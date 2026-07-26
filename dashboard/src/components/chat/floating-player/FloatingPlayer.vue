<script setup lang="ts">
/**
 * Standalone floating video popup, launched from the playlist panel. Shares
 * geometry and opacity with the scroll-out float: drag by the bar, resize
 * from any edge or corner, dock with ✕.
 */
import { GripVertical } from '@lucide/vue';
import { computed } from 'vue';

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
      <GripVertical class="floating-player__grip" aria-hidden="true" />
      <span class="floating-player__title">{{ launchedVideo.title }}</span>
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
        class="floating-player__close"
        aria-label="Close video"
        title="Close video"
        @pointerdown.stop
        @click.stop="close"
      >
        ✕
      </button>
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
  padding: var(--spacing-1) var(--spacing-1-5);
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

.floating-player__grip {
  flex-shrink: 0;
  width: 0.9rem;
  height: 0.9rem;
  color: var(--color-fg-muted);
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

.floating-player__opacity-slider {
  flex-shrink: 0;
  appearance: none;
  width: 4.5rem;
  height: 0.25rem;
  margin: 0;
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
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: none;
  font-size: 0.7rem;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
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
