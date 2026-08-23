<script setup lang="ts">
import { computed } from 'vue';

import type { ArticleCard } from '@/types/harness-response-data.model.js';

import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

const props = defineProps<{
  title?: string;
  items?: ArticleCard[];
  /** First card spans the full grid row (ar5), set by the art direction. */
  spans?: boolean;
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is ArticleCard =>
      typeof item === 'object' &&
      item !== null &&
      (typeof (item as ArticleCard).url === 'string' ||
        typeof (item as ArticleCard).title === 'string' ||
        typeof (item as ArticleCard).description === 'string'),
  ),
);
</script>

<template>
  <section v-if="validItems.length" class="cards">
    <SectionTitle v-if="title" :title="title" />
    <div class="cards-grid" :class="{ 'cards-grid--spans': spans }">
      <article
        v-for="(card, index) in validItems"
        :key="index"
        class="card"
        :class="{ 'card--link': card.url }"
      >
        <h4 v-if="card.title">{{ card.title }}</h4>
        <p v-if="card.description">{{ card.description }}</p>
        <a
          v-if="card.url"
          :href="card.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ card.linkLabel || 'Read more' }}
        </a>
      </article>
    </div>
  </section>
</template>

<style scoped>
.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6em;
  margin-top: 0.5em;
}

@media (min-width: 640px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  /* ar5 merged block: the lead card takes a full-width row. */
  .cards-grid--spans .card:first-child {
    grid-column: 1 / -1;
  }
}

.card {
  border: 1px solid var(--color-divider);
  padding: 0.6em 0.75em;
  background: var(--color-bg-tertiary);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.card--link:hover {
  border-color: var(--color-accent-primary);
  background: color-mix(
    in srgb,
    var(--color-accent-primary) 4%,
    var(--color-bg-tertiary)
  );
}

.card h4 {
  font-size: 0.95em;
  margin: 0 0 0.35em;
  color: var(--color-fg-primary);
}

.card p {
  margin: 0 0 0.5em;
  font-size: 0.9em;
  color: var(--color-fg-secondary);
  white-space: pre-line;
}

.card a {
  color: var(--color-accent-primary);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.9em;
}

.card a:hover {
  text-decoration: underline;
}
</style>
