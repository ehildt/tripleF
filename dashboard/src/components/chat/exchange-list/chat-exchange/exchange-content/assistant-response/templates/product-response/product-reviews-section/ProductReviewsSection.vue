<script setup lang="ts">
/**
 * Review highlights as editorial pull quotes: oversized quote glyph, calm
 * text, hairline separators — no cards.
 */
import type { ReviewSummary } from '@/types/harness-response-data.model';

defineProps<{ reviews: readonly ReviewSummary[] }>();
</script>

<template>
  <section class="reviews-section">
    <h2 class="reviews-section__title">Review highlights</h2>
    <ul class="reviews-section__list">
      <li v-for="(review, idx) in reviews" :key="idx" class="review-quote">
        <span class="review-quote__glyph" aria-hidden="true">”</span>
        <p class="review-quote__text">{{ review.text }}</p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.reviews-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.reviews-section__title {
  margin: 0;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-fg-muted);
}

.reviews-section__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.review-quote {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-divider);
}

.review-quote:first-child {
  border-top: 1px solid var(--color-divider);
}

.review-quote__glyph {
  flex-shrink: 0;
  font-size: 1.6rem;
  line-height: 1;
  color: var(--color-accent-primary);
}

.review-quote__text {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--color-fg-secondary);
}
</style>
