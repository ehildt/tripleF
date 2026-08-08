<script setup lang="ts">
import { computed } from 'vue';

import type { Source } from '@/types/harness-response-data.model';

import { pickCycleColor } from '../../shared/helpers/pick-cycle-color.helper';
import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';

const props = defineProps<{
  items?: Source[];
  /** Section heading — defaults to the localized "Sources". */
  title?: string;
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
    <SectionTitle :title="title ?? $t('common.sources')" />
    <ul>
      <li
        v-for="(source, index) in validItems"
        :key="index"
        :style="{ '--source-color': pickCycleColor(index) }"
      >
        <a
          v-if="source.url"
          :href="source.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ source.title || source.url }}
        </a>
        <template v-else-if="source.title">{{ source.title }}</template>
        <span v-if="source.sourceName" class="sources__source">
          {{ source.sourceName }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.sources ul {
  list-style: none;
  padding-inline: var(--spacing-2);
  margin: 0;
}

.sources ul li {
  position: relative;
  padding-left: 1.25em;
  margin-bottom: 0.3em;
}

.sources ul li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.55em;
  width: 0.5em;
  height: 0.5em;
  background: var(--source-color, var(--color-accent-primary));
}

.sources ul li a {
  color: var(--color-accent-primary);
  text-decoration: none;
}

.sources ul li a:hover {
  text-decoration: underline;
}

.sources__source {
  margin-left: var(--spacing-2);
  color: var(--color-fg-muted);
  font-size: 0.8rem;
}
</style>
