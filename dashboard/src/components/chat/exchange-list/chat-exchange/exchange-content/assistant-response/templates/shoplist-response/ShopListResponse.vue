<script setup lang="ts">
/**
 * Compact product/shop list for follow-up shopping questions about an
 * already-introduced product: a lean header and a price-sorted list of
 * purchase options — no galleries, videos, or review sections.
 */
import { computed } from 'vue';

import type {
  HarnessResponseData,
  ShopOffer,
} from '@/types/harness-response-data.model';

import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { priceNumeric } from '../../shared/helpers/price-numeric.helper';
import ShopListOfferCard from './shoplist-offer-card/ShopListOfferCard.vue';

const props = defineProps<{ data: HarnessResponseData }>();

const offers = computed<ShopOffer[]>(() => {
  if (!props.data.shopOffers?.length) return [];
  return [...props.data.shopOffers].sort(
    (a, b) => priceNumeric(a.price) - priceNumeric(b.price),
  );
});

const hasContent = computed(
  () => Boolean(props.data.title) || offers.value.length > 0,
);
</script>

<template>
  <section v-if="hasContent" class="shoplist">
    <!-- Lean header: category eyebrow, product name, one line of context -->
    <header class="shoplist__header">
      <span v-if="data.category" class="shoplist__category">
        {{ data.category }}
      </span>
      <h2 class="shoplist__title">{{ data.title }}</h2>
      <p v-if="data.subtitle" class="shoplist__subtitle">
        {{ data.subtitle }}
      </p>
      <p v-if="data.shortDescription" class="shoplist__description">
        {{ data.shortDescription }}
      </p>
    </header>

    <!-- Purchase options sorted by ascending price -->
    <div v-if="offers.length" class="shoplist__offers">
      <ShopListOfferCard
        v-for="(offer, index) in offers"
        :key="offer.link ?? index"
        :offer="offer"
        :is-best-price="index === 0 && offers.length > 1"
      />
    </div>

    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <section v-else class="shoplist shoplist--empty">
    <p>No purchase options found for this request.</p>
  </section>
</template>

<style scoped>
.shoplist {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.shoplist__header {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
}

.shoplist__category {
  font-size: 0.7rem;
  font-family: var(--font-mono);
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-fg-muted);
}

.shoplist__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  line-height: 1.25;
  color: var(--color-fg-primary);
}

.shoplist__subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-fg-secondary);
}

.shoplist__description {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
}

.shoplist__offers {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.shoplist--empty {
  padding: var(--spacing-4);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-tertiary);
  text-align: center;
  color: var(--color-fg-muted);
}
</style>
