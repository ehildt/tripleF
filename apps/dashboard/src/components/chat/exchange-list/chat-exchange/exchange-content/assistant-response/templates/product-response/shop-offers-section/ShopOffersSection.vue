<script setup lang="ts">
import type { ShopOffer } from '@/types/harness-response-data.model';

import EyebrowTitle from '../../../shared/ui/eyebrow-title/EyebrowTitle.vue';
import ShopOfferCard from './shop-offer-card/ShopOfferCard.vue';

defineProps<{ offers: readonly ShopOffer[] }>();
</script>

<template>
  <section v-if="offers.length" class="offers-section">
    <EyebrowTitle :title="$t('common.whereToBuy')" />
    <div class="offers-section__list">
      <ShopOfferCard
        v-for="(offer, index) in offers"
        :key="index"
        :offer="offer"
        :is-best-price="index === 0 && offers.length > 1"
      />
    </div>
  </section>
</template>

<style scoped>
.offers-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}

.offers-section__list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-1);
  /* Reset the global .exchange-message div padding leak. */
  padding: 0;
}

@media (max-width: 40rem) {
  .offers-section__list {
    grid-template-columns: 1fr;
  }
}
</style>
