<script setup lang="ts">
/**
 * Product banner: a full-width, detailed product image with an always-visible
 * rating overlay (stars, value, count, verdict) pinned to the bottom of the
 * image — the same overlay treatment the image list uses for its captions,
 * but permanently shown. Title, subtitle and category sit above the banner;
 * an optional caption sits below. Clicking the image opens the lightbox.
 *
 * When the product has more than one image (banner + gallery), a glassy "+N"
 * badge sits in the top-right corner of the figure — the same frosted look as
 * the video/iframe play block — telling the user how many images the product
 * carries total.
 */
import { computed, inject } from 'vue';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../../../composables/helpers/is-trusted-image-url.helper';
import StarRatingIndicator from '../../../shared/ui/star-rating-indicator/StarRatingIndicator.vue';

const props = defineProps<{
  category?: string;
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  /** Total number of images for this product (banner + gallery). */
  imageCount?: number;
  rating?: number;
  ratingCount?: number;
  ratingLabel?: string;
}>();

const onImageClicked = inject<HarnessImageClickedHandler>(
  harnessImageClickedKey,
  () => undefined,
);

const hasImage = computed(
  () => Boolean(props.imageUrl) && isTrustedImageUrl(props.imageUrl ?? ''),
);

const hasRating = computed(
  () => typeof props.rating === 'number' && props.rating > 0,
);

const slide = computed<GalleryItem | undefined>(() => {
  if (!hasImage.value) return undefined;
  return {
    imageUrl: props.imageUrl!,
    imageAlt: props.imageAlt,
    title: props.title,
  };
});

const label = computed(() => props.imageAlt || props.title || 'Product image');

function openLightbox() {
  if (slide.value) onImageClicked?.(slide.value);
}
</script>

<template>
  <section class="product-banner">
    <header class="product-banner__header">
      <p v-if="category" class="product-banner__eyebrow">{{ category }}</p>
      <h1 v-if="title" class="product-banner__title">{{ title }}</h1>
      <p v-if="subtitle" class="product-banner__subtitle">{{ subtitle }}</p>
    </header>

    <figure class="product-banner__figure">
      <button
        v-if="hasImage"
        type="button"
        class="product-banner__trigger"
        :aria-label="`View full size: ${label}`"
        @click="openLightbox"
      >
        <img
          :src="encodeURI(imageUrl!)"
          :alt="imageAlt || title || 'Product image'"
          class="product-banner__img"
          loading="lazy"
          decoding="async"
        />

        <span v-if="hasRating" class="product-banner__rating">
          <StarRatingIndicator :rating="rating!" :count="ratingCount" />
          <span class="product-banner__rating-value">
            {{ rating!.toFixed(1) }}
          </span>
          <span v-if="ratingCount" class="product-banner__rating-count">
            · {{ ratingCount.toLocaleString() }} reviews
          </span>
          <span v-if="ratingLabel" class="product-banner__rating-label">
            {{ ratingLabel }}
          </span>
        </span>
      </button>

      <div v-else class="product-banner__placeholder">
        <span>NO IMAGE</span>
      </div>

      <span
        v-if="imageCount && imageCount > 0"
        class="product-banner__count"
        aria-hidden="true"
      >
        +{{ imageCount }}
      </span>

      <figcaption v-if="imageCaption" class="product-banner__caption">
        <p>{{ imageCaption }}</p>
      </figcaption>
    </figure>
  </section>
</template>

<style scoped>
.product-banner {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.product-banner__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.product-banner__eyebrow {
  margin: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-accent-primary);
}

.product-banner__title {
  margin: 0;
  font-size: 2rem;
  line-height: 1.15;
  color: var(--color-fg-primary);
}

.product-banner__subtitle {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-fg-muted);
}

.product-banner__figure {
  position: relative;
  display: flex;
  flex-direction: column;
  margin: 0;
  width: 100%;
  overflow: hidden;
  border: 1px solid var(--color-divider);
  background: var(--color-bg-secondary);
}

.product-banner__trigger {
  all: unset;
  position: relative;
  display: block;
  width: 100%;
  height: 360px;
  overflow: hidden;
  cursor: zoom-in;
}

.product-banner__trigger:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -2px;
}

.product-banner__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-banner__placeholder {
  display: grid;
  place-items: center;
  width: 100%;
  height: 240px;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  letter-spacing: 0.1em;
  color: var(--color-fg-muted);
}

/* Always-visible rating overlay pinned to the bottom of the image. */
.product-banner__rating {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-1-5);
  padding: var(--spacing-2) var(--spacing-3);
  background: linear-gradient(
    to top,
    color-mix(in srgb, black 80%, transparent),
    transparent
  );
  color: white;
  font-size: 0.85rem;
}

.product-banner__rating-value {
  font-weight: 700;
}

.product-banner__rating-count {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: color-mix(in srgb, white 80%, transparent);
}

/* Glassy "+N" image-count badge pinned to the top-right corner of the
   figure. Uses the same frosted look as the video/iframe play block:
   translucent accent tint, backdrop blur, no border. */
.product-banner__count {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 1;
  display: grid;
  place-items: center;
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--spacing-1-5);
  opacity: 0.9;
  background: color-mix(in srgb, var(--color-accent-primary) 28%, transparent);
  border: none;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: white;
  font-size: 0.85rem;
  font-weight: 700;
}

.product-banner__rating-label {
  margin-left: auto;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: color-mix(in srgb, white 85%, transparent);
}

.product-banner__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85rem;
  color: var(--color-fg-muted);
  border-top: 1px solid var(--color-divider);
}

.product-banner__caption p {
  margin: 0;
}

@media (max-width: 40rem) {
  .product-banner__trigger,
  .product-banner__placeholder {
    height: 160px;
  }
}
</style>
