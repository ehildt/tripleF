<script setup lang="ts">
/**
 * Compact product/shop list for follow-up shopping questions about an
 * already-introduced product: a lean header and a price-sorted list of
 * purchase options — no galleries, videos, or review sections.
 */
import InternationalCoverageSection from '../../sections/international-coverage-section/InternationalCoverageSection.vue';
import SourcesSection from '../../sections/sources-section/SourcesSection.vue';
import { useShopListResponseData } from './composables/use-shoplist-response-data.composable';
import ShopListOfferCard from './shoplist-offer-card/ShopListOfferCard.vue';
import type { ShopListResponseProps } from './ShopListResponse.types';

const props = defineProps<ShopListResponseProps>();

const { offers, hasContent } = useShopListResponseData(props);
</script>

<template>
  <section v-if="hasContent" class="shoplist">
    <!-- Lean header: product name, one line of context -->
    <header class="shoplist__header">
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

    <InternationalCoverageSection :items="data.internationalCoverage" />
    <SourcesSection :items="data.sources" />
  </section>

  <!-- Empty state -->
  <section v-else class="shoplist shoplist--empty">
    <p>{{ $t('common.noPurchaseOptions') }}</p>
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
