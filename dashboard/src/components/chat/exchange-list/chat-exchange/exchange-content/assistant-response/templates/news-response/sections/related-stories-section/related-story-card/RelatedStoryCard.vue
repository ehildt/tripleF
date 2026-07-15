<script setup lang="ts">
import type { RelatedStory } from '@/types/harness-response-data.model';

defineProps<{
  item: RelatedStory;
}>();

function metaFor(story: RelatedStory): string {
  const parts: string[] = [];
  if (story.sourceName) parts.push(story.sourceName);
  if (story.date) parts.push(story.date);
  return parts.join(' · ');
}

function imageAltFor(story: RelatedStory): string {
  return story.title || story.sourceName || 'Related story image';
}
</script>

<template>
  <li class="related-story__item">
    <figure>
      <div v-if="item.imageUrl" class="related-story__media">
        <img
          :src="encodeURI(item.imageUrl)"
          :alt="imageAltFor(item)"
          loading="lazy"
          decoding="async"
        />
      </div>
      <figcaption
        v-if="item.title || item.url || metaFor(item)"
        class="related-story__caption"
      >
        <a
          v-if="item.url"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <strong v-if="item.title">{{ item.title }}</strong>
          <strong v-else>{{ item.url }}</strong>
        </a>
        <strong v-else-if="item.title">{{ item.title }}</strong>
        <p v-if="metaFor(item)">{{ metaFor(item) }}</p>
      </figcaption>
    </figure>
  </li>
</template>

<style scoped>
.related-story__item {
  display: block !important;
  flex-wrap: nowrap !important;
  list-style: none;
  border: none !important;
  padding: 0 !important;
}

.related-story__item figure {
  margin: 0;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  background: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 240px;
  width: 100%;
  padding: 0 !important;
}

.related-story__media {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  background: var(--color-bg-tertiary);
  display: block !important;
  flex-wrap: nowrap !important;
  border: none !important;
  padding: 0 !important;
  flex: 1 1 auto;
}

.related-story__media img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100% !important;
  max-height: none !important;
  object-fit: cover;
  display: block;
}

.related-story__media img:hover {
  animation: none !important;
  box-shadow: none !important;
}

.related-story__caption {
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.85em;
  color: var(--color-fg-muted);
}

.related-story__caption a,
.related-story__caption strong {
  display: block;
  color: var(--color-fg-primary);
  margin-bottom: 0.25em;
  text-decoration: none;
}

.related-story__caption p {
  margin: 0 0 0.5em;
  padding: 0 !important;
}
</style>
