import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ShopOfferCardProps } from '../ShopOfferCard.types';

/** Derives the display price, falling back to the check-price label. */
export function useShopOfferCard(props: ShopOfferCardProps) {
  const { t } = useI18n();

  const displayPrice = computed(
    () => props.offer.price ?? t('common.checkPrice'),
  );

  return { displayPrice };
}
