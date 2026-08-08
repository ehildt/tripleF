<script setup lang="ts">
import { Info, ListMinus, ListPlus } from '@lucide/vue';
import { computed } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type { VideoGalleryItem } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../composables/helpers/media/build-video-poster-url.helper';
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
    <!-- The card is a plain div (not a figure) so it never nests the media
         figure inside another figure; padding: 0 overrides the global
         .exchange-message div padding so the media stays flush. -->
    <div class="video-gallery__card">
      <!-- Header row: title linking to the source, and on the right the
           info toggle (description/caption) next to the playlist toggle. -->
      <div class="video-gallery__header">
        <Tooltip v-if="item.title" :text="item.title" :max-width="'280px'">
          <a
            :href="item.videoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="video-gallery__title"
            >{{ item.title }}</a
          >
        </Tooltip>

        <div class="video-gallery__header-actions">
          <!-- Info toggle: only shown when the video carries a description or
               caption; its tooltip shows them. -->
          <Tooltip
            v-if="item.description || item.caption"
            :text="item.title ?? ''"
            :max-width="'280px'"
          >
            <button
              type="button"
              class="video-gallery__info-toggle"
              :aria-label="$t('common.moreInfo')"
            >
              <Info class="video-gallery__info-icon" />
            </button>
            <template #content>
              <div class="video-gallery__tooltip">
                <span
                  v-if="item.description"
                  class="video-gallery__tooltip-desc"
                  >{{ item.description }}</span
                >
                <span
                  v-if="item.caption"
                  class="video-gallery__tooltip-caption"
                  >{{ item.caption }}</span
                >
              </div>
            </template>
          </Tooltip>

          <Tooltip
            :text="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
          >
            <button
              type="button"
              class="video-gallery__playlist-toggle"
              :class="{
                'video-gallery__playlist-toggle--added': isInPlaylist,
              }"
              :aria-label="
                isInPlaylist ? 'Remove from playlist' : 'Add to playlist'
              "
              :aria-pressed="isInPlaylist"
              @click.stop="togglePlaylistVideo"
            >
              <ListMinus
                v-if="isInPlaylist"
                class="video-gallery__playlist-toggle-icon"
              />
              <ListPlus v-else class="video-gallery__playlist-toggle-icon" />
            </button>
          </Tooltip>
        </div>
      </div>

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
    </div>
  </li>
</template>

<style scoped>
.video-gallery__item .video-gallery__card {
  position: relative;
  margin: 0 auto;
  /* Beat the global .exchange-message div padding so the media stays flush. */
  padding: 0;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  background: var(--color-bg-tertiary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  width: 100%;
}

/* ---------- header row (title + playlist toggle above the video) ---------- */

/* The chained selector beats the global .exchange-message div padding rule
   (specificity 0-2-1) so the header doesn't inherit --spacing-2. */
.video-gallery__item .video-gallery__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-2);
  padding: 0.5rem;
}

.video-gallery__title {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-fg-primary);
  text-decoration: none;
  /* Single-line ellipsis: titles are truncated to one row; the full title
     is available on hover via the tooltip. */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-gallery__title:hover {
  color: var(--color-accent-primary);
}

/* ---------- rich tooltip content (description + caption) ----------
   The panel is teleported to <body>; the slot elements keep this component's
   scope id, so these scoped rules still apply. */

.video-gallery__tooltip {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.video-gallery__tooltip-desc,
.video-gallery__tooltip-caption {
  font-weight: 500;
  color: var(--color-fg-secondary);
}

.video-gallery__tooltip-caption {
  color: var(--color-fg-muted);
  font-style: italic;
}

/* ---------- header actions (info + playlist toggle) ---------- */

/* Chained selector beats the global div padding rule; the actions row has
   no padding of its own. */
.video-gallery__item .video-gallery__header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
  padding: 0;
}

.video-gallery__info-toggle {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background-color: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.video-gallery__info-toggle:hover {
  color: var(--color-fg-primary);
}

.video-gallery__info-toggle:focus {
  outline: none;
}

.video-gallery__info-toggle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.video-gallery__info-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

/* ---------- playlist toggle (quiet nav-style icon in the header) ---------- */

.video-gallery__playlist-toggle {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: none;
  background-color: transparent;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.video-gallery__playlist-toggle:hover {
  color: var(--color-fg-primary);
}

.video-gallery__playlist-toggle--added,
.video-gallery__playlist-toggle--added:hover {
  color: var(--color-accent-primary);
}

.video-gallery__playlist-toggle:focus {
  outline: none;
}

.video-gallery__playlist-toggle:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.video-gallery__playlist-toggle-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
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
}

@media (min-width: 1024px) {
  /* 3+ items in 3-column mode: a lone last-row item is wide and centered. */
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
</style>
