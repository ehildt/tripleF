<script setup lang="ts">
import { computed } from 'vue';

import type { InternationalCoverageEntry } from '@/types/harness-response-data.model';

const props = defineProps<{
  items?: InternationalCoverageEntry[];
}>();

const validItems = computed(() =>
  (props.items ?? []).filter(
    (item): item is InternationalCoverageEntry =>
      typeof item === 'object' &&
      item !== null &&
      (!!item.title || !!item.url || !!item.summary),
  ),
);
</script>

<template>
  <section
    v-if="validItems.length"
    class="international-coverage-section"
    aria-label="International coverage"
  >
    <h3 class="international-coverage-section__title">
      International Coverage
    </h3>
    <ul class="international-coverage-section__list">
      <li
        v-for="(item, index) in validItems"
        :key="index"
        class="international-coverage-section__item"
      >
        <span
          v-if="item.language"
          class="international-coverage-section__lang"
          >{{ item.language.toUpperCase() }}</span
        >
        <a
          v-if="item.url"
          class="international-coverage-section__headline"
          :href="item.url"
          target="_blank"
          rel="noopener noreferrer"
          >{{ item.title || item.url }}</a
        >
        <span v-else class="international-coverage-section__headline">{{
          item.title
        }}</span>
        <span
          v-if="item.sourceName"
          class="international-coverage-section__source"
          >{{ item.sourceName }}</span
        >
        <p v-if="item.summary" class="international-coverage-section__summary">
          {{ item.summary }}
        </p>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.international-coverage-section {
  width: 100%;
}

.international-coverage-section__title {
  margin-bottom: var(--spacing-2);
}

.international-coverage-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  margin: 0;
  padding: 0;
  list-style: none;
}

.international-coverage-section__item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  padding: var(--spacing-2) var(--spacing-3);
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.international-coverage-section__lang {
  align-self: flex-start;
  padding: 0 var(--spacing-1);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
  border: 1px solid var(--color-divider);
}

.international-coverage-section__headline {
  font-weight: 600;
  color: var(--color-fg-primary);
  text-decoration: none;
}

.international-coverage-section__headline:hover {
  text-decoration: underline;
}

.international-coverage-section__source {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  color: var(--color-fg-muted);
}

.international-coverage-section__summary {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
}
</style>
