<script setup lang="ts">
import { computed } from 'vue';

import SectionTitle from '../../shared/ui/section-title/SectionTitle.vue';
import type { DiscardEntry } from './helpers/to-discard-entry.helper';
import { toDiscardEntry } from './helpers/to-discard-entry.helper';
import type { DiscardedReferencesSectionProps } from './DiscardedReferencesSection.types';

const props = defineProps<DiscardedReferencesSectionProps>();

const entries = computed(() =>
  (props.items ?? [])
    .map(toDiscardEntry)
    .filter((entry): entry is DiscardEntry => entry !== undefined),
);
</script>

<template>
  <section
    v-if="entries.length"
    class="discarded-references-section"
    :aria-label="$t('common.discardedReferences')"
  >
    <SectionTitle :title="$t('common.discardedReferences')" />
    <ul class="discarded-references-section__list">
      <li
        v-for="(entry, index) in entries"
        :key="index"
        class="discarded-references-section__item"
      >
        <img
          v-if="entry.thumbUrl"
          :src="entry.thumbUrl"
          :alt="entry.label"
          loading="lazy"
          class="discarded-references-section__thumb"
        />
        <div class="discarded-references-section__body">
          <a
            v-if="entry.href"
            :href="entry.href"
            target="_blank"
            rel="noopener noreferrer"
            class="discarded-references-section__title"
            >{{ entry.label }}</a
          >
          <span v-else class="discarded-references-section__title">{{
            entry.label
          }}</span>
          <p class="discarded-references-section__reason">
            {{ entry.reason || $t('common.discardedReasonNotUsed') }}
          </p>
        </div>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.discarded-references-section {
  width: 100%;
  background-color: var(--color-bg-primary);
  padding: var(--spacing-2) var(--spacing-3);
}

.discarded-references-section__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.discarded-references-section__item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.discarded-references-section__thumb {
  width: 6rem;
  height: 4rem;
  object-fit: cover;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  flex-shrink: 0;
}

.discarded-references-section__body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  min-width: 0;
}

.discarded-references-section__title {
  font-weight: 600;
  color: var(--color-fg-primary);
}

.discarded-references-section__reason {
  margin: 0;
  font-size: 0.875em;
  color: var(--color-fg-muted);
  font-style: italic;
}
</style>
