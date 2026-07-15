<script setup lang="ts">
import { computed } from 'vue';

import type { ArticleCard } from '@/types/harness-response-data.model.js';

const props = defineProps<{
  title?: string;
  items?: ArticleCard[];
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
    <h3 v-if="title">{{ title }}</h3>
    <div class="cards-grid">
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
.cards > h3 {
  margin-bottom: 0.5em;
}

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
}

.card {
  border: 1px solid var(--color-divider);
  padding: 0.6em 0.75em;
  background: var(--color-bg-secondary);
  transition:
    border-color 0.2s ease,
    background 0.2s ease;
}

.card--link:hover {
  border-color: var(--color-accent-primary);
  background: color-mix(
    in srgb,
    var(--color-accent-primary) 4%,
    var(--color-bg-secondary)
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
