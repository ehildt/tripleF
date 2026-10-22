<script setup lang="ts">
/**
 * One taxonomy leaf row: a linked indicator, the text (in full — no silent
 * truncation), the stamp date, and an outbound source link for encyclopedia
 * chunks; below, the folded-in chunk ids as small mono bullets when the leaf
 * folds more than one. Pure presentation — nothing emits.
 */
import { ExternalLink, Link2 } from '@lucide/vue';

import type { TaxonomyLeafRowProps } from './TaxonomyLeafRow.types';

defineProps<TaxonomyLeafRowProps>();
</script>

<template>
  <li class="taxonomy-leaf-row">
    <div class="taxonomy-leaf-row__body">
      <div class="taxonomy-leaf-row__lead">
        <Link2
          v-if="leaf.linked"
          :size="12"
          class="taxonomy-leaf-row__linked"
          :title="$t('common.memoryTaxonomyLeafLinked')"
        />
        <p class="taxonomy-leaf-row__text">{{ leaf.text }}</p>
        <span v-if="leaf.stampedAt" class="taxonomy-leaf-row__date">{{
          leaf.stampedAt.slice(0, 10)
        }}</span>
        <a
          v-if="leaf.href"
          class="taxonomy-leaf-row__source"
          :href="leaf.href"
          target="_blank"
          rel="noopener noreferrer"
          :title="$t('common.memoryTaxonomyLeafSource')"
        >
          <ExternalLink :size="12" />
        </a>
      </div>
      <ul v-if="leaf.memberIds.length > 1" class="taxonomy-leaf-row__members">
        <li
          v-for="memberId in leaf.memberIds"
          :key="memberId"
          class="taxonomy-leaf-row__member"
          :title="memberId"
        >
          {{ memberId }}
        </li>
      </ul>
    </div>
  </li>
</template>

<style scoped>
.taxonomy-leaf-row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  padding: var(--spacing-1-5) var(--spacing-3);
}

.taxonomy-leaf-row__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.taxonomy-leaf-row__lead {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
}

.taxonomy-leaf-row__linked {
  flex-shrink: 0;
  align-self: center;
  color: var(--color-accent-primary);
}

.taxonomy-leaf-row__text {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
  /* Facts/titles wrap in full — the panel shows everything, grouped; no
   * silent truncation. */
  overflow-wrap: anywhere;
}

.taxonomy-leaf-row__date {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
}

.taxonomy-leaf-row__members {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
  margin: 0;
  padding: var(--spacing-1) 0 0 var(--spacing-4);
  list-style: none;
}

/* The chunk ids folded into one source — small mono bullets, one per
 * point, because the ids ARE the information (no label needed). */
.taxonomy-leaf-row__member {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  color: var(--color-fg-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  list-style: disc inside;
}

.taxonomy-leaf-row__source {
  flex-shrink: 0;
  align-self: center;
  display: inline-flex;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
}

.taxonomy-leaf-row__source:hover {
  color: var(--color-accent-primary);
}
</style>
