import { computed, inject } from 'vue';
import { useI18n } from 'vue-i18n';

import type {
  GalleryItem,
  HarnessImageClickedHandler,
} from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import { isTrustedImageUrl } from '../../../../composables/helpers/media/is-trusted-image-url.helper';
import type { ProductBannerProps } from '../ProductBanner.types';

/**
 * Derives the product banner's display values from its props: the trusted
 * image slide, the rating presence, and the locale-formatted rating labels.
 * The image load/error state lives in the shared AsyncImage.
 */
export function useProductBanner(props: ProductBannerProps) {
  const onImageClicked = inject<HarnessImageClickedHandler>(
    harnessImageClickedKey,
    () => undefined,
  );

  const { locale, t } = useI18n();

  const hasImage = computed(
    () => Boolean(props.imageUrl) && isTrustedImageUrl(props.imageUrl ?? ''),
  );

  const hasRating = computed(
    () => typeof props.rating === 'number' && props.rating > 0,
  );

  const slide = computed<GalleryItem | undefined>(() => {
    if (!hasImage.value) return undefined;
    return {
      imageUrl: props.imageUrl!,
      imageAlt: props.imageAlt,
      title: props.title,
    };
  });

  const label = computed(
    () => props.imageAlt || props.title || t('common.productImage'),
  );

  /** Locale-formatted rating count and pluralized "reviews" label. */
  const ratingCountNumber = computed(() =>
    props.ratingCount
      ? new Intl.NumberFormat(locale.value).format(props.ratingCount)
      : '',
  );
  const reviewsLabel = computed(() =>
    props.ratingCount ? t('common.reviews', { count: props.ratingCount }) : '',
  );

  function openLightbox() {
    if (slide.value) onImageClicked?.(slide.value);
  }

  return {
    hasImage,
    hasRating,
    slide,
    label,
    ratingCountNumber,
    reviewsLabel,
    openLightbox,
  };
}
