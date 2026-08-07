<script setup lang="ts">
import { computed } from 'vue';

import type { Source } from '@/types/harness-response-data.model';

const props = defineProps<{
  items?: Source[];
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is Source =>
      typeof item === 'object' &&
      item !== null &&
      (typeof (item as Source).url === 'string' ||
        typeof (item as Source).title === 'string'),
  ),
);
</script>

<template>
  <section v-if="validItems.length" class="news-sources">
    <h3>{{ $t('common.sources') }}</h3>
    <ul class="news-sources__list">
      <li
        v-for="(source, index) in validItems"
        :key="index"
        class="news-sources__item"
      >
        <a
          v-if="source.url"
          class="news-sources__link"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ source.title || source.url }}
        </a>
        <span v-else-if="source.title" class="news-sources__title">{{
          source.title
        }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.news-sources h3 {
  margin-bottom: 0.5em;
}

.news-sources__list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.news-sources__item {
  position: relative;
  padding-left: 1.25em;
  margin-bottom: 0.3em;
  font-size: 0.9em;
  color: var(--color-fg-secondary);
}

.news-sources__item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.5em;
  height: 0.5em;
  background: var(--color-accent-primary);
}

.news-sources__item:nth-child(2)::before {
  background: var(--color-harmony-1);
}

.news-sources__item:nth-child(3)::before {
  background: var(--color-harmony-2);
}

.news-sources__item:nth-child(4)::before {
  background: var(--color-harmony-3);
}

.news-sources__item:nth-child(5)::before {
  background: var(--color-harmony-4);
}

.news-sources__link {
  color: var(--color-accent-primary);
  text-decoration: none;
}

.news-sources__link:hover {
  text-decoration: underline;
}

.news-sources__title {
  color: var(--color-fg-secondary);
}
</style>
