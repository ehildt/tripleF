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
  <section v-if="validItems.length" class="sources">
    <h3>Sources</h3>
    <ul>
      <li v-for="(source, index) in validItems" :key="index">
        <a
          v-if="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ source.title || source.url }}
        </a>
        <template v-else-if="source.title">{{ source.title }}</template>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sources h3 {
  margin-bottom: 0.5em;
}

.sources ul {
  list-style: none;
  padding: var(--spacing-2);
  margin: 0;
}

.sources ul li {
  position: relative;
  padding-left: 1.25em;
  margin-bottom: 0.3em;
  font-size: 0.9em;
  color: var(--color-fg-secondary);
}

.sources ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.5em;
  height: 0.5em;
  background: var(--color-accent-primary);
}

.sources ul li:nth-child(2)::before {
  background: var(--color-harmony-1);
}

.sources ul li:nth-child(3)::before {
  background: var(--color-harmony-2);
}

.sources ul li:nth-child(4)::before {
  background: var(--color-harmony-3);
}

.sources ul li:nth-child(5)::before {
  background: var(--color-harmony-4);
}

.sources ul li a {
  color: var(--color-accent-primary);
  text-decoration: none;
}

.sources ul li a:hover {
  text-decoration: underline;
}
</style>
