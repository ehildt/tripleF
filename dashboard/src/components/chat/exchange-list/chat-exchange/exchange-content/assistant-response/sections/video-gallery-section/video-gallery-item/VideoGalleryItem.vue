<script setup lang="ts">
import { ListCheck, ListPlus } from '@lucide/vue';
import { computed } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../composables/helpers/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../../composables/use-playlist-toggle';
import FloatingVideoFigure from '../../floating-video-figure/FloatingVideoFigure.vue';

const props = defineProps<{
  item: VideoGalleryItem;
}>();

const posterUrl = computed(
  () => props.item.thumbnailUrl || buildVideoPosterUrl(props.item.videoUrl),
);

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(
  () => props.item,
);
</script>

<template>
  <li v-if="item.videoUrl" class="video-gallery__item">
    <figure class="video-gallery__card">
      <!-- The media sits flush inside the card, exactly like the video list:
           no wrapper box, so nothing fights the floating popup. The
           video-gallery__video class lands on the figure's root element and
           carries the layout constraints below. -->
      <FloatingVideoFigure
        class="video-gallery__video"
        :video-url="item.videoUrl"
        :title="item.title"
        :poster-url="posterUrl"
      />
      <!-- Playlist toggle in the card's top-right corner -->
      <button
        type="button"
        class="video-gallery__playlist-toggle"
        :class="{ 'video-gallery__playlist-toggle--added': isInPlaylist }"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-pressed="isInPlaylist"
        @click.stop="togglePlaylistVideo"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="video-gallery__playlist-toggle-icon"
        />
        <ListPlus v-else class="video-gallery__playlist-toggle-icon" />
      </button>
      <figcaption
        v-if="item.title || item.caption"
        class="video-gallery__caption"
      >
        <strong v-if="item.title && item.title !== item.caption">{{
          item.title
        }}</strong>
        <p v-if="item.caption">{{ item.caption }}</p>
      </figcaption>
    </figure>
  </li>
</template>

<style scoped>
.video-gallery__item .video-gallery__card {
  position: relative;
  margin: 0 auto;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  width: 100%;
}

/* ---------- playlist toggle (top-right corner) ---------- */

.video-gallery__playlist-toggle {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  margin: 0.1rem 0.1rem 0 0;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.video-gallery__playlist-toggle:hover {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-border);
}

.video-gallery__playlist-toggle--added {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 15%,
    var(--color-bg-elevated)
  );
}

.video-gallery__playlist-toggle-icon {
  width: 0.9rem;
  height: 0.9rem;
}

/* Single-item gallery: constrain the player box and center it. */
:global(.video-gallery--count-1 > li) .video-gallery__card {
  flex: 0 0 auto;
  min-height: 0;
  height: 100%;
  width: 70%;
  align-items: center;
  justify-content: center;
}

:global(.video-gallery--count-1 > li) .video-gallery__video {
  flex: 0 0 auto;
  min-height: 0;
  width: 100%;
  aspect-ratio: 16 / 9;
  height: auto;
  max-height: 100%;
}

@media (min-width: 640px) {
  /* 3+ items in 2-column mode: a lone last-row item is wide and centered. */
  :global(.video-gallery--count-3-plus > li:nth-child(2n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    height: 100%;
    width: 70%;
    align-items: center;
    justify-content: center;
  }

  :global(.video-gallery--count-3-plus > li:nth-child(2n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 16 / 9;
    height: auto;
    max-height: 100%;
  }
}

@media (min-width: 1024px) {
  /* 3+ items in 3-column mode: a lone last-row item is wide and centered. */
  :global(.video-gallery--count-3-plus > li:nth-child(3n + 1):last-child)
    .video-gallery__card {
    flex: 0 0 auto;
    min-height: 0;
    height: 100%;
    width: 70%;
    align-items: center;
    justify-content: center;
  }

  :global(.video-gallery--count-3-plus > li:nth-child(3n + 1):last-child)
    .video-gallery__video {
    flex: 0 0 auto;
    min-height: 0;
    width: 100%;
    aspect-ratio: 16 / 9;
    height: auto;
    max-height: 100%;
  }
}

/* Layout constraints for the FloatingVideoFigure root (class fallthrough).
   No background of its own — the media box inside owns the backdrop, so the
   card never reads as a card in a card. */
.video-gallery__item .video-gallery__video {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  flex: 1 1 auto;
}

.video-gallery__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85em;
  color: var(--color-fg-muted);
}

.video-gallery__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
}

.video-gallery__caption p {
  margin: 0 0 0.5em;
}
</style>
