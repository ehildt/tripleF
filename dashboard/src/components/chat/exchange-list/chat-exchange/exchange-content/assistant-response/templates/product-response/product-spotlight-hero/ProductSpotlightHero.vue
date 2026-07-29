<script setup lang="ts">
/**
 * Editorial product hero: media on the left (2/5 of the row — video first,
 * image otherwise), the decision column on the right (3/5): eyebrow label,
 * large title, rating, prominent price, lead description, buy advice and a
 * text-link CTA to the cheapest offer. Depth comes from whitespace and
 * hairlines — no boxes, no tint panels, no truncation.
 */
import { ListCheck, ListPlus } from '@lucide/vue';
import { computed, inject, toRef } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
  ShopOffer,
  VideoGalleryItem,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { buildVideoPosterUrl } from '../../../composables/helpers/build-video-poster-url.helper';
import { usePlaylistToggle } from '../../../composables/use-playlist-toggle';
import FloatingVideoFigure from '../../../sections/floating-video-figure/FloatingVideoFigure.vue';
import StarRatingIndicator from '../star-rating-indicator/StarRatingIndicator.vue';
import { useHeroImageViewer } from './composables/use-hero-image-viewer';

const props = defineProps<{
  category?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  imageUrl?: string;
  imageAlt?: string;
  images?: GalleryItem[];
  galleryTitle?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoCaption?: string;
  rating?: number;
  ratingCount?: number;
  ratingLabel?: string;
  priceRange?: string;
  offerCount?: number;
  buyAdvice?: string;
  bestOffer?: ShopOffer;
}>();

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
);

const { slides, selectedIndex, selectedSlide, selectSlide } =
  useHeroImageViewer({
    imageUrl: toRef(props, 'imageUrl'),
    imageAlt: toRef(props, 'imageAlt'),
    title: toRef(props, 'title'),
    images: toRef(props, 'images'),
  });

const hasHeroVideo = computed(() => Boolean(props.videoUrl));

const videoPosterUrl = computed(() =>
  props.videoUrl ? buildVideoPosterUrl(props.videoUrl) : null,
);

/** The hero video as a playlist entry: title falls back to the caption. */
const heroVideoItem = computed<VideoGalleryItem>(() => ({
  videoUrl: props.videoUrl ?? '',
  title: props.videoTitle || props.videoCaption,
  caption: props.videoCaption,
}));

const { isInPlaylist, togglePlaylistVideo } = usePlaylistToggle(heroVideoItem);

const eyebrow = computed(() =>
  [props.category, props.ratingLabel].filter(Boolean).join(' · '),
);

const ctaLabel = computed(() => {
  const source = props.bestOffer?.source;
  const price = props.bestOffer?.price;
  if (source && price) return `Best deal: ${price} at ${source}`;
  if (source) return `Best deal at ${source}`;
  return 'View best deal';
});

function openLightbox() {
  if (selectedSlide.value) onImageClicked?.(selectedSlide.value);
}

/** In video-hero mode a thumb click opens that slide in the lightbox;
 *  otherwise it just switches the viewer. */
function handleThumbClick(index: number) {
  selectSlide(index);
  if (hasHeroVideo.value) openLightbox();
}
</script>

<template>
  <section class="spotlight">
    <!-- Media column (2/5) -->
    <div class="spotlight__viewer">
      <div
        class="spotlight__media"
        :class="{ 'spotlight__media--video': hasHeroVideo }"
      >
        <FloatingVideoFigure
          v-if="hasHeroVideo"
          :video-url="videoUrl!"
          :title="videoTitle || videoCaption"
          :poster-url="videoPosterUrl"
        />
        <!-- Playlist toggle in the media's top-right corner -->
        <button
          v-if="hasHeroVideo"
          type="button"
          class="spotlight__playlist-toggle"
          :class="{ 'spotlight__playlist-toggle--added': isInPlaylist }"
          :title="isInPlaylist ? 'Remove from playlist' : 'Add to playlist'"
          :aria-pressed="isInPlaylist"
          @click.stop="togglePlaylistVideo"
        >
          <ListCheck
            v-if="isInPlaylist"
            class="spotlight__playlist-toggle-icon"
          />
          <ListPlus v-else class="spotlight__playlist-toggle-icon" />
        </button>
        <button
          v-else-if="selectedSlide"
          type="button"
          class="spotlight__trigger"
          :aria-label="`View full size: ${selectedSlide.imageAlt || title || 'Product image'}`"
          @click="openLightbox"
        >
          <img
            :src="selectedSlide.imageUrl"
            :alt="selectedSlide.imageAlt || title || 'Product image'"
            class="spotlight__img"
            loading="lazy"
          />
        </button>
        <div v-else class="spotlight__placeholder">
          <span>NO IMAGE</span>
        </div>
      </div>

      <!-- Image thumbnail strip (independent of the hero video) -->
      <div
        v-if="slides.length > 1 || (hasHeroVideo && slides.length)"
        class="spotlight__thumbs-wrap"
      >
        <p v-if="galleryTitle" class="spotlight__gallery-title">
          {{ galleryTitle }}
        </p>
        <div class="spotlight__thumbs">
          <button
            v-for="(slide, index) in slides"
            :key="slide.imageUrl"
            type="button"
            class="spotlight__thumb"
            :class="{
              'spotlight__thumb--active':
                !hasHeroVideo && index === selectedIndex,
            }"
            :aria-label="`Show image ${index + 1} of ${slides.length}`"
            @click="handleThumbClick(index)"
          >
            <img
              :src="slide.imageUrl"
              :alt="slide.imageAlt || `Product image ${index + 1}`"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- Decision column (3/5) -->
    <div class="spotlight__info">
      <p v-if="eyebrow" class="spotlight__eyebrow">{{ eyebrow }}</p>
      <h1 class="spotlight__title">{{ title }}</h1>
      <p v-if="subtitle" class="spotlight__subtitle">{{ subtitle }}</p>

      <div v-if="rating" class="spotlight__rating">
        <StarRatingIndicator :rating="rating" :count="ratingCount" />
        <span class="spotlight__rating-value">{{ rating.toFixed(1) }}</span>
        <span v-if="ratingCount" class="spotlight__rating-count">
          · {{ ratingCount.toLocaleString() }} reviews
        </span>
      </div>

      <div v-if="priceRange || (offerCount ?? 0) > 0" class="spotlight__price">
        <span v-if="priceRange" class="spotlight__price-value">
          {{ priceRange }}
        </span>
        <span v-if="(offerCount ?? 0) > 0" class="spotlight__stores">
          from {{ offerCount }} store{{ offerCount === 1 ? '' : 's' }}
        </span>
      </div>

      <p v-if="description" class="spotlight__lead">{{ description }}</p>

      <p v-if="buyAdvice" class="spotlight__advice">{{ buyAdvice }}</p>

      <a
        v-if="bestOffer?.link"
        :href="bestOffer.link"
        target="_blank"
        rel="noopener noreferrer"
        class="spotlight__cta"
      >
        {{ ctaLabel }} →
      </a>
    </div>
  </section>
</template>

<style scoped>
.spotlight {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: var(--spacing-4);
  align-items: start;
}

/* ---------- media column ---------- */

.spotlight__viewer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
  min-width: 0;
}

.spotlight__media {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  width: 100%;
  aspect-ratio: 4 / 3;
  background-color: var(--color-bg-tertiary);
}

/* ---------- playlist toggle (top-right corner) ---------- */

.spotlight__playlist-toggle {
  position: absolute;
  top: var(--spacing-1);
  right: var(--spacing-1);
  margin: 0.1rem 0.1rem 0 0;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 1.5rem;
  height: 1.5rem;
  color: white;
  cursor: pointer;
  background: color-mix(in srgb, black 55%, transparent);
  backdrop-filter: blur(12px) saturate(1.5);
  -webkit-backdrop-filter: blur(12px) saturate(1.5);
  box-shadow:
    0 0.3rem 1rem color-mix(in srgb, black 45%, transparent),
    inset 0 0 0 1px color-mix(in srgb, white 12%, transparent);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease;
}

.spotlight__playlist-toggle:hover {
  color: white;
  background: var(--color-accent-primary);
}

.spotlight__playlist-toggle--added {
  color: white;
  background: color-mix(in srgb, var(--color-accent-primary) 85%, transparent);
}

.spotlight__playlist-toggle-icon {
  filter: drop-shadow(0 1px 2px color-mix(in srgb, black 60%, transparent));
  width: 0.9rem;
  height: 0.9rem;
}

.spotlight__media--video {
  aspect-ratio: 16 / 9;
}

.spotlight__trigger {
  all: unset;
  display: block;
  width: 100%;
  height: 100%;
  cursor: zoom-in;
}

.spotlight__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -2px;
}

.spotlight__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.spotlight__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--color-fg-muted);
}

/* ---------- thumbnails ---------- */

.spotlight__thumbs-wrap {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.spotlight__gallery-title {
  margin: 0;
  font-size: 0.65rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-fg-muted);
}

.spotlight__thumbs {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.spotlight__thumb {
  all: unset;
  width: 3rem;
  height: 3rem;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  cursor: pointer;
  opacity: 0.65;
  transition:
    opacity 0.2s ease,
    border-color 0.2s ease;
}

.spotlight__thumb:hover {
  opacity: 1;
}

.spotlight__thumb--active {
  opacity: 1;
  border-color: var(--color-accent-primary);
}

.spotlight__thumb:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 1px;
}

.spotlight__thumb img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* ---------- decision column ---------- */

.spotlight__info {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
  min-width: 0;
}

.spotlight__eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent-primary);
}

.spotlight__title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.15;
  color: var(--color-fg-primary);
}

.spotlight__subtitle {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-fg-muted);
}

.spotlight__rating {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1-5);
  font-size: 0.85rem;
}

.spotlight__rating-value {
  font-weight: 700;
  color: var(--color-fg-primary);
}

.spotlight__rating-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-fg-muted);
}

.spotlight__price {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  flex-wrap: wrap;
  padding: var(--spacing-2) 0;
  border-top: 1px solid var(--color-divider);
  border-bottom: 1px solid var(--color-divider);
}

.spotlight__price-value {
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-fg-primary);
}

.spotlight__stores {
  font-size: 0.8rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.spotlight__lead {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-fg-secondary);
}

.spotlight__advice {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-fg-muted);
}

.spotlight__cta {
  align-self: flex-start;
  margin-top: var(--spacing-1);
  font-size: 1rem;
  font-weight: 700;
  text-decoration: none;
  color: var(--color-accent-primary);
  border-bottom: 1px solid var(--color-accent-primary);
  padding-bottom: var(--spacing-0-5);
  transition:
    color 0.2s ease,
    border-color 0.2s ease;
}

.spotlight__cta:hover {
  color: var(--color-accent-hover);
  border-color: var(--color-accent-hover);
}

.spotlight__cta:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}

/* ---------- responsive ---------- */

@media (max-width: 40rem) {
  .spotlight {
    grid-template-columns: 1fr;
  }
}
</style>
