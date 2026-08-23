import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { runInSetup } from '@/test-utils/run-in-setup';

import type { ProductBannerProps } from '../ProductBanner.types';
import { useProductBanner } from './use-product-banner.composable';

function makeProps(
  partial: Partial<ProductBannerProps> = {},
): ProductBannerProps {
  return reactive({
    title: 'Sony WH-1000XM5',
    imageUrl: 'https://example.com/hero.jpg',
    ...partial,
  });
}

describe('useProductBanner', () => {
  it('reports no image when the url is absent or untrusted', () => {
    const noUrl = runInSetup(() =>
      useProductBanner(makeProps({ imageUrl: undefined })),
    );
    expect(noUrl.hasImage.value).toBe(false);

    const untrusted = runInSetup(() =>
      useProductBanner(makeProps({ imageUrl: 'javascript:alert(1)' })),
    );
    expect(untrusted.hasImage.value).toBe(false);
  });

  it('exposes a trusted image as the lightbox slide', () => {
    const { slide } = runInSetup(() => useProductBanner(makeProps()));

    expect(slide.value).toEqual(
      expect.objectContaining({ imageUrl: 'https://example.com/hero.jpg' }),
    );
  });
});
