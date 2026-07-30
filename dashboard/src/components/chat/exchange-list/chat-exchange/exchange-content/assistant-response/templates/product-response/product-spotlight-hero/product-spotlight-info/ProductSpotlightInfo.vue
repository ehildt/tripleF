<script setup lang="ts">
/**
 * Decision column of the product spotlight: eyebrow label, title, subtitle,
 * rating, price, short description, buy advice and the best-deal CTA.
 */
import { computed } from 'vue';

import type { ShopOffer } from '@/types/harness-response-data.model';

import StarRatingIndicator from '../../../../shared/ui/star-rating-indicator/StarRatingIndicator.vue';

const props = defineProps<{
  category?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  rating?: number;
  ratingCount?: number;
  ratingLabel?: string;
  priceRange?: string;
  offerCount?: number;
  buyAdvice?: string;
  bestOffer?: ShopOffer;
}>();

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
</script>

<template>
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
</template>

<style scoped>
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
</style>
