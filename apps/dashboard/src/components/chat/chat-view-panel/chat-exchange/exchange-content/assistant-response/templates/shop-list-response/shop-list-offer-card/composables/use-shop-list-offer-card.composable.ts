import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import type { ShopListOfferCardProps } from '../ShopListOfferCard.types';

/** Derives the CTA label from the offer's shop name, with a fallback. */
export function useShopListOfferCard(props: ShopListOfferCardProps) {
  const { t } = useI18n();

  const ctaLabel = computed(() =>
    props.offer.source
      ? t('common.viewAt', { source: props.offer.source })
      : t('common.visitShop'),
  );

  return { ctaLabel };
}
