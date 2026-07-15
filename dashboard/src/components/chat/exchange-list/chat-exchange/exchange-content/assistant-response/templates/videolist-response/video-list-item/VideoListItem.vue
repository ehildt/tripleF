<script setup lang="ts">
/**
 * One card of the video playlist grid: title header, floating player, meta +
 * caption, and a scrollable description section at the bottom. The media
 * floats as a draggable popup once engaged and scrolled out of view (see
 * FloatingVideoFigure). The top-right toggle adds the video to the
 * conversation's playlist.
 */
import { ListCheck, ListPlus } from '@lucide/vue';
import { computed } from 'vue';

import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../composables/helpers/build-video-poster-url.helper';
import { activePlaybackVideoUrl } from '../../../composables/video-playback.state';
import FloatingVideoFigure from '../../../sections/floating-video-figure/FloatingVideoFigure.vue';
import { usePlaylistToggle } from './composables/use-playlist-toggle';
import { buildVideoMetaLine } from './helpers/build-video-meta-line.helper';

const props = defineProps<{
  item: VideoGalleryItem;
}>();

const metaLine = computed(() => buildVideoMetaLine(props.item));

const posterUrl = computed(
  () => props.item.thumbnailUrl || buildVideoPosterUrl(props.item.videoUrl),
);

const isActivePlayback = computed(
  () => activePlaybackVideoUrl.value === props.item.videoUrl,
);

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(
  () => props.item,
);
</script>

<template>
  <li class="video-item">
    <figure
      class="video-item__card"
      :class="{ 'video-item__card--active': isActivePlayback }"
    >
      <!-- Header row above the video: title linking to the source -->
      <div class="video-item__header">
        <a
          :href="item.videoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="video-item__title"
          >{{ item.title }}</a
        >
      </div>

      <!-- Media: poster until clicked, then the single mounted player;
           floats as a draggable popup once scrolled out of view. -->
      <FloatingVideoFigure
        :video-url="item.videoUrl"
        :title="item.title"
        :poster-url="posterUrl"
      />

      <!-- Playlist toggle in the card's top-right corner -->
      <button
        type="button"
        class="video-item__playlist-toggle"
        :class="{ 'video-item__playlist-toggle--added': isInPlaylist }"
        :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
        :aria-pressed="isInPlaylist"
        @click.stop="togglePlaylistVideo"
      >
        <ListCheck
          v-if="isInPlaylist"
          class="video-item__playlist-toggle-icon"
        />
        <ListPlus v-else class="video-item__playlist-toggle-icon" />
      </button>

      <figcaption class="video-item__caption-bar">
        <span v-if="metaLine" class="video-item__meta">{{ metaLine }}</span>
        <p v-if="item.caption" class="video-item__caption">
          {{ item.caption }}
        </p>
      </figcaption>

      <!-- Description / lyrics section, only when data is available -->
      <div v-if="item.description" class="video-item__description">
        <span class="video-item__description-label">Description</span>
        <p class="video-item__description-text">{{ item.description }}</p>
      </div>
    </figure>
  </li>
</template>

<style scoped>
.video-item {
  display: flex;
  min-width: 0;
}

/* ---------- video card (mirrors the video gallery card) ---------- */

.video-item__card {
  position: relative;
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  transition: border-color 0.2s ease;
}

.video-item__card:hover {
  border-color: var(--color-accent-border);
}

/* Currently playing video (engaged most recently) */
.video-item__card--active {
  border-color: var(--color-accent-primary);
  box-shadow: 0 0 0 1px
    color-mix(in srgb, var(--color-accent-primary) 45%, transparent);
}

/* ---------- header row (title above the video) ---------- */

.video-item__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-2);
  /* room for the absolutely positioned playlist toggle in the top-right */
  padding: var(--spacing-1-5) var(--spacing-8) var(--spacing-1-5)
    var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.video-item__title {
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  text-decoration: none;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-item__title:hover {
  color: var(--color-accent-primary);
}

/* ---------- playlist toggle (top-right corner) ---------- */

.video-item__playlist-toggle {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  margin: 0.1rem 0.1rem 0 0;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  border: 1px solid var(--color-divider);
  background-color: color-mix(
    in srgb,
    var(--color-bg-elevated) 85%,
    transparent
  );
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.video-item__playlist-toggle:hover {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-border);
}

.video-item__playlist-toggle--added {
  color: var(--color-accent-primary);
  border-color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 15%,
    var(--color-bg-elevated)
  );
}

.video-item__playlist-toggle-icon {
  width: 0.9rem;
  height: 0.9rem;
}

/* ---------- caption bar (meta + caption below the video) ---------- */

.video-item__caption-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  padding: var(--spacing-1-5) var(--spacing-2);
}

.video-item__meta {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.video-item__caption {
  margin: var(--spacing-0-5) 0 0;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-fg-muted);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ---------- description section ---------- */

.video-item__description {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: 0 var(--spacing-2) var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-2);
  border-left: 3px solid var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
  max-height: 10rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: var(--color-accent-primary) var(--color-bg-secondary);
}

.video-item__description-label {
  flex-shrink: 0;
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-fg-muted);
}

.video-item__description-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
  white-space: pre-line;
}
</style>
