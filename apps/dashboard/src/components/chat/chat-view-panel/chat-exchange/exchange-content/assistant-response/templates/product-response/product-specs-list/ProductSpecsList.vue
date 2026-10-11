<script setup lang="ts">
/**
 * Full spec table: eyebrow heading plus label/value rows separated by
 * hairlines — editorial style, no box, no zebra, no truncation.
 */
import EyebrowTitle from '@/components/chat/chat-view-panel/chat-exchange/exchange-content/assistant-response/shared/ui/eyebrow-title/EyebrowTitle.vue';

import { useProductSpecsList } from './composables/use-product-specs-list.composable';
import type { ProductSpecsListProps } from './ProductSpecsList.types';

const props = defineProps<ProductSpecsListProps>();

const { rows } = useProductSpecsList(props);
</script>

<template>
  <section class="product-specs-list">
    <EyebrowTitle :title="$t('common.keySpecs')" />
    <ul class="product-specs-list__table">
      <li v-for="(row, idx) in rows" :key="idx" class="product-specs-list__row">
        <template v-if="row.label">
          <span class="product-specs-list__label">{{ row.label }}</span>
          <span class="product-specs-list__value">{{ row.value }}</span>
        </template>
        <span
          v-else
          class="product-specs-list__value product-specs-list__value--full"
        >
          {{ row.value }}
        </span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.product-specs-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.product-specs-list__table {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.product-specs-list__row {
  display: flex;
  align-items: baseline;
  gap: var(--spacing-3);
  padding: var(--spacing-1-5) 0;
  border-bottom: 1px solid var(--color-divider);
}

.product-specs-list__row:first-child {
  border-top: 1px solid var(--color-divider);
}

.product-specs-list__label {
  flex-shrink: 0;
  width: 9rem;
  font-size: 0.7rem;
  font-family: var(--font-mono);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
  overflow-wrap: anywhere;
}

.product-specs-list__value {
  min-width: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-fg-primary);
}

.product-specs-list__value--full {
  color: var(--color-fg-secondary);
}

@media (max-width: 40rem) {
  .product-specs-list__label {
    width: 6.5rem;
  }
}
</style>
