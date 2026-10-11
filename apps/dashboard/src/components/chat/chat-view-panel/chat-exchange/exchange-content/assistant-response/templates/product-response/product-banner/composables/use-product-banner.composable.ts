import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import { isTrustedImageUrl } from '@/stores/helpers/harness/media/is-trusted-image-url.helper';
import type { GalleryItem } from '@/types/harness-response-data.model';

import type { ProductBannerProps } from '../ProductBanner.types';

/**
 * Derives the product banner's display values from its props: the trusted
 * image slide, the rating presence, and the locale-formatted rating labels.
 * The image load/error state lives in the shared AsyncImage. The lightbox-open
 * callback is passed in via the owning surface (no provide/inject).
 */
export function useProductBanner(props: ProductBannerProps) {
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

  const ratingValue = computed(() =>
    hasRating.value && props.rating !== undefined
      ? props.rating.toFixed(1)
      : '',
  );
  const countText = computed(() =>
    ratingCountNumber.value && reviewsLabel.value
      ? `${ratingCountNumber.value} ${reviewsLabel.value}`
      : '',
  );

  function openLightbox() {
    if (slide.value) props.onImageClick?.(slide.value);
  }

  return {
    hasImage,
    hasRating,
    slide,
    label,
    ratingValue,
    countText,
    openLightbox,
  };
}
