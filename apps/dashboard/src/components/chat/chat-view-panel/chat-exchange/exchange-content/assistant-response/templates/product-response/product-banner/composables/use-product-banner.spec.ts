import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, reactive } from 'vue';

import type { ProductBannerProps } from '../ProductBanner.types';
import { useProductBanner } from './use-product-banner';

/** Run a callback inside a mounted component's `setup` (vue-i18n's `useI18n` requires a setup context). */
function runInSetup<T>(run: () => T): T {
  let result!: T;
  mount(
    defineComponent({
      setup() {
        result = run();
        return () => h('div');
      },
    }),
  );
  return result;
}

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
