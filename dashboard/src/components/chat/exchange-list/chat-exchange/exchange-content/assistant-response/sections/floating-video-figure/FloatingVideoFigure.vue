<script setup lang="ts">
/**
 * Embeddable video figure used by every video surface in the chat (video
 * lists, video galleries, hero media). Figures render as posters; the
 * poster the user clicks becomes the single mounted player (autoplay),
 * replacing whatever was mounted before. Once the player scrolls out of
 * view, the media floats as a draggable, resizable popup that keeps
 * playing and docks back when the figure is in view again (unless autodock
 * is disabled in the popout settings). The popup's close button either
 * docks the media back inline without interrupting playback, or stops and
 * deselects the video — per the stop-on-close setting. Unembeddable URLs
 * degrade to an external link.
 */
import { computed } from 'vue';

import { playlistMarqueeVisible } from '../../../../../../composables/right-panel-view.state';
import { useFloatingPlayer } from '../../composables/use-floating-player';
import { usePlaylistToggle } from '../../composables/use-playlist-toggle';
import FloatingVideoPopupBar from './popup-bar/FloatingVideoPopupBar.vue';

const props = defineProps<{
  videoUrl: string;
  title?: string;
  posterUrl?: string | null;
}>();

const item = computed(() => ({
  videoUrl: props.videoUrl,
  title: props.title,
}));

const {
  setCardElement,
  setMediaElement,
  setPlayerElement,
  shouldMountPlayer,
  isFloating,
  popupStyle,
  floatingPopupOpacity,
  playerSrc,
  isDirectVideo,
  isUnembeddable,
  engage,
  dismissFloating,
  closeFloating,
  closeFloatingTitle,
  startDrag,
  startResize,
  setOpacity,
} = useFloatingPlayer(item);

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(item);

/** The now-playing marquee rides the popout unless the playlist bar carries it. */
const showTitleMarquee = computed(
  () => isFloating.value && !playlistMarqueeVisible.value,
);

const RESIZE_DIRECTIONS = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const;

const opacityPercent = computed(() =>
  Math.round(floatingPopupOpacity.value * 100),
);
</script>

<template>
  <figure :ref="setCardElement" class="floating-video-figure">
    <!-- Media: inline player, or a fixed draggable popup once engaged and
         scrolled out of view. The element is never re-parented, so
         playback continues uninterrupted. -->
    <div
      :ref="setMediaElement"
      class="floating-video-figure__media"
      :class="{ 'floating-video-figure__media--floating': isFloating }"
      :style="popupStyle"
      @pointerdown="engage"
    >
      <FloatingVideoPopupBar
        v-if="isFloating"
        :title="title"
        :show-title-marquee="showTitleMarquee"
        :opacity-percent="opacityPercent"
        :is-in-playlist="isInPlaylist"
        :close-title="closeFloatingTitle"
        @drag="startDrag"
        @opacity-input="setOpacity"
        @toggle-playlist="togglePlaylistVideo"
        @close="closeFloating()"
      />

      <template v-if="shouldMountPlayer">
        <video
          v-if="isDirectVideo"
          :ref="setPlayerElement"
          :src="videoUrl"
          controls
          autoplay
          class="floating-video-figure__player"
        />
        <iframe
          v-else
          :ref="setPlayerElement"
          :src="playerSrc"
          class="floating-video-figure__player"
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
      </template>
      <a
        v-else-if="isUnembeddable"
        :href="videoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="floating-video-figure__fallback"
      >
        Watch on source ↗
      </a>

      <!-- Poster state: this figure is not the active playback. Clicking it
           makes it the single mounted player (the previously mounted one
           unmounts in the same render flush) and autoplays it. -->
      <button
        v-else
        type="button"
        class="floating-video-figure__poster"
        aria-label="Play video"
        @click="engage"
      >
        <img
          v-if="posterUrl"
          :src="posterUrl"
          alt=""
          class="floating-video-figure__poster-image"
          loading="lazy"
        />
        <span class="floating-video-figure__poster-play" aria-hidden="true"
          >▶</span
        >
      </button>

      <template v-if="isFloating">
        <span
          v-for="direction in RESIZE_DIRECTIONS"
          :key="direction"
          class="floating-video-figure__resize"
          :class="`floating-video-figure__resize--${direction}`"
          aria-hidden="true"
          @pointerdown="startResize(direction, $event)"
        />
      </template>
    </div>

    <!-- Placeholder keeps the layout while the media floats -->
    <div v-if="isFloating" class="floating-video-figure__placeholder">
      <span class="floating-video-figure__placeholder-text"
        >Playing in the floating player</span
      >
      <button
        type="button"
        class="floating-video-figure__placeholder-dock"
        @click="dismissFloating"
      >
        Dock back
      </button>
    </div>
  </figure>
</template>

<style scoped>
/* A <figure> root sidesteps the global .exchange-content__body :deep(div)
   padding rule (it only targets divs and list elements). */
.floating-video-figure {
  margin: 0;
  width: 100%;
}

/* ---------- media ---------- */

/* The chained selector beats the global .exchange-content__body :deep(div)
   padding so the player sits flush inside its card. height: 100% lets the
   media fill taller-than-16/9 boxes (gallery rows stretch cards to equal
   heights); aspect-ratio still drives the box when the parent height is
   indefinite. */
.floating-video-figure .floating-video-figure__media {
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  background: var(--color-bg-tertiary);
}

.floating-video-figure .floating-video-figure__media--floating {
  position: fixed;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  width: 22rem;
  max-width: calc(100vw - 2rem);
  /* auto, not the base 100% — 100% would mean viewport height while fixed. */
  height: auto;
  aspect-ratio: auto;
  border: 1px solid
    color-mix(in srgb, var(--color-accent-border) 45%, transparent);
  overflow: visible;
  background: color-mix(in srgb, var(--color-bg-elevated) 55%, transparent);
  backdrop-filter: blur(16px) saturate(1.5);
  -webkit-backdrop-filter: blur(16px) saturate(1.5);
  box-shadow:
    0 0.5rem 2rem color-mix(in srgb, black 45%, transparent),
    0 0 1.5rem color-mix(in srgb, var(--color-accent-glow) 25%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 6%, transparent);
  transition: border-color 0.2s ease;
}

.floating-video-figure .floating-video-figure__media--floating:hover {
  border-color: var(--color-accent-border);
}

/* Chained selector: the global .exchange-content__body :deep(iframe) rule
   draws a square 1px border on every iframe — it must not win here, or the
   player shows a second border inside its card. */
.floating-video-figure .floating-video-figure__player {
  display: block;
  width: 100%;
  height: 100%;
  border: none;
  position: absolute;
  inset: 0;
  object-fit: contain;
}

.floating-video-figure
  .floating-video-figure__media--floating
  .floating-video-figure__player {
  position: static;
  flex: 1;
  min-height: 0;
  /* 16/9 keeps the first popup (no explicit geometry yet) from collapsing
     to the iframe's intrinsic height; once dragged/resized, the explicit
     container box wins and the ratio is ignored. */
  aspect-ratio: 16 / 9;
}

.floating-video-figure__fallback {
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

/* ---------- poster state (not the active playback) ---------- */

.floating-video-figure__poster {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  width: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
}

.floating-video-figure__poster-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.floating-video-figure__poster-play {
  position: relative;
  z-index: 1;
  display: grid;
  place-items: center;
  width: 3rem;
  height: 3rem;
  background: color-mix(in srgb, black 60%, transparent);
  color: white;
  font-size: 1.1rem;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.floating-video-figure__poster:hover .floating-video-figure__poster-play {
  transform: scale(1.1);
  background: var(--color-accent-primary);
}

/* ---------- resize handles (edges + corners) ---------- */

.floating-video-figure__resize {
  position: absolute;
  z-index: 2;
  touch-action: none;
}

.floating-video-figure__resize--n,
.floating-video-figure__resize--s {
  left: 1rem;
  right: 1rem;
  height: 0.5rem;
  cursor: ns-resize;
}

.floating-video-figure__resize--n {
  top: -0.25rem;
}

.floating-video-figure__resize--s {
  bottom: -0.25rem;
}

.floating-video-figure__resize--e,
.floating-video-figure__resize--w {
  top: 1rem;
  bottom: 1rem;
  width: 0.5rem;
  cursor: ew-resize;
}

.floating-video-figure__resize--e {
  right: -0.25rem;
}

.floating-video-figure__resize--w {
  left: -0.25rem;
}

.floating-video-figure__resize--ne,
.floating-video-figure__resize--nw,
.floating-video-figure__resize--se,
.floating-video-figure__resize--sw {
  width: 1rem;
  height: 1rem;
}

.floating-video-figure__resize--ne {
  top: -0.25rem;
  right: -0.25rem;
  cursor: nesw-resize;
}

.floating-video-figure__resize--nw {
  top: -0.25rem;
  left: -0.25rem;
  cursor: nwse-resize;
}

.floating-video-figure__resize--se {
  bottom: -0.25rem;
  right: -0.25rem;
  cursor: nwse-resize;
}

.floating-video-figure__resize--sw {
  bottom: -0.25rem;
  left: -0.25rem;
  cursor: nesw-resize;
}

/* ---------- placeholder while floating ---------- */

.floating-video-figure__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  background-color: var(--color-bg-tertiary);
}

.floating-video-figure__placeholder-text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.floating-video-figure__placeholder-dock {
  padding: var(--spacing-0-5) var(--spacing-1-5);
  border: 1px solid var(--color-divider);
  background: none;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.floating-video-figure__placeholder-dock:hover {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-border);
}
</style>
