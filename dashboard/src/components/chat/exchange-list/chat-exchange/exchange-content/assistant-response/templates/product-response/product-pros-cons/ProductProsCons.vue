<script setup lang="ts">
/**
 * Two-column review consensus: strengths and caveats with eyebrow headings
 * and ✓/✕ markers — flat, no tinted cards.
 */
import type { KeyFinding } from '@/types/harness-response-data.model';

import EyebrowTitle from '../../../shared/ui/eyebrow-title/EyebrowTitle.vue';

defineProps<{
  pros?: readonly KeyFinding[];
  cons?: readonly KeyFinding[];
}>();
</script>

<template>
  <section v-if="pros?.length || cons?.length" class="pros-cons">
    <div v-if="pros?.length" class="pros-cons__column">
      <EyebrowTitle :title="$t('common.pros')" tone="success" ruled />
      <ul class="pros-cons__list">
        <li v-for="(item, idx) in pros" :key="idx" class="pros-cons__row">
          <span class="pros-cons__marker pros-cons__marker--pros">✓</span>
          <span>{{ item.text }}</span>
        </li>
      </ul>
    </div>

    <div v-if="cons?.length" class="pros-cons__column">
      <EyebrowTitle :title="$t('common.cons')" tone="error" ruled />
      <ul class="pros-cons__list">
        <li v-for="(item, idx) in cons" :key="idx" class="pros-cons__row">
          <span class="pros-cons__marker pros-cons__marker--cons">✕</span>
          <span>{{ item.text }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.pros-cons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-4);
}

@media (max-width: 40rem) {
  .pros-cons {
    grid-template-columns: 1fr;
  }
}

.pros-cons__column {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
  min-width: 0;
  /* Reset the global .exchange-message div padding leak. */
  padding: 0;
}

.pros-cons__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.pros-cons__row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-2);
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-fg-secondary);
}

.pros-cons__marker {
  flex-shrink: 0;
  font-size: 0.8rem;
  font-weight: 700;
}

.pros-cons__marker--pros {
  color: var(--color-status-success);
}

.pros-cons__marker--cons {
  color: var(--color-status-error);
}
</style>
