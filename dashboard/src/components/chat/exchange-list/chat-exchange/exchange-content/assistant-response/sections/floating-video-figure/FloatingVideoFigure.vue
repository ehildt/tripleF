<script setup lang="ts">
/**
 * Embeddable video figure used by every video surface in the chat (video
 * lists, video galleries, hero media). Figures never mount a player
 * themselves: they render a poster, and clicking it launches the video into
 * the app-level floating player (see video-playback.state). While the
 * figure is in view, that player overlays this figure's media box exactly —
 * positioned via CSS alone, never re-parented, so playback continues
 * uninterrupted when it flips between inline, floating popup, and back
 * (scrolling), and it survives tab and conversation switches. Unembeddable
 * URLs degrade to an external link.
 */
import { computed } from 'vue';

import { usePlaybackAnchor } from '../../composables/use-playback-anchor';

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
  setAnchorElement,
  isLaunchedHere,
  isDockedHere,
  isUnembeddable,
  engage,
} = usePlaybackAnchor(item);
</script>

<template>
  <figure class="floating-video-figure">
    <!-- Anchor box: while this figure's video is launched and in view, the
         app-level floating player overlays this box exactly. The box itself
         never hosts a player element. -->
    <div
      :ref="setAnchorElement"
      class="floating-video-figure__media"
      :class="{
        'floating-video-figure__media--docked': isDockedHere,
        'floating-video-figure__media--playing': isLaunchedHere,
      }"
    >
      <!-- Unembeddable URLs degrade to an external link. -->
      <a
        v-if="isUnembeddable"
        :href="videoUrl"
        target="_blank"
        rel="noopener noreferrer"
        class="floating-video-figure__fallback"
      >
        Watch on source ↗
      </a>

      <!-- Launched but not docked here (just popped out / hidden window):
           the vacated figure keeps the layout. Its poster is grayscaled,
           dimmed and slightly blurred to mark that the video popped out
           into the floating player. -->
      <div
        v-else-if="isLaunchedHere"
        class="floating-video-figure__placeholder"
      >
        <img
          v-if="posterUrl"
          :src="posterUrl"
          alt=""
          class="floating-video-figure__placeholder-image"
          loading="lazy"
        />
      </div>

      <!-- Poster state: this figure's video is not launched. Clicking it
           launches the app-level floating player right on top of this box
           (or as the popup when the figure is not in view). -->
      <button
        v-else
        type="button"
        class="floating-video-figure__poster"
        :aria-label="$t('common.playVideo')"
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
    </div>
  </figure>
</template>

<style scoped>
/* A <figure> root sidesteps the global .exchange-message :deep(div)
   padding rule (it only targets divs and list elements). */
.floating-video-figure {
  margin: 0;
  width: 100%;
}

/* ---------- media ---------- */

/* The chained selector beats the global .exchange-message :deep(div)
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

/* Launched here: the overlaying floating player provides the surface —
   keep the box's dimensions, drop its own background so nothing flashes at
   the edges of the overlay. */
.floating-video-figure .floating-video-figure__media--playing {
  background: transparent;
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

/* ---------- poster state (not launched) ---------- */

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
  border: none;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    opacity 0.15s ease,
    backdrop-filter 0.15s ease;
}

.floating-video-figure__poster:hover .floating-video-figure__poster-play {
  transform: scale(1.1);
  /* Glassy frosted effect instead of a solid fill: translucent accent tint
     with a backdrop blur, no border, and a slightly transparent button. */
  opacity: 0.9;
  background: color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
  border: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

/* ---------- placeholder while launched elsewhere ---------- */

/* Chained selectors beat the global .exchange-message div rules (padding,
   div:has(> img) card chrome) — the placeholder must fill its card exactly
   like the docked overlay does, on every video surface. */
.floating-video-figure .floating-video-figure__placeholder {
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
  aspect-ratio: 16 / 9;
  padding: 0;
  border: none;
  background-color: var(--color-bg-tertiary);
  overflow: hidden;
}

/* Popped-out marker: the figure's own poster, grayscaled, dimmed and
   slightly blurred so the vacated slot reads "this video just popped out"
   instead of an empty box or a live-looking thumbnail. */
.floating-video-figure .floating-video-figure__placeholder-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: default;
  filter: grayscale(0.65) brightness(0.55) hue-rotate(0.2turn) sepia(0.5);
  /* The blur would otherwise bleed its soft edge into the figure's own
     border; scale it a touch in so the blurred rim stays inside. */
  transform: scale(1.04);
}
</style>
