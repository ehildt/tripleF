import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import type { HarnessResponseData } from '@/types/harness-response-data.model';

import type { ProductResponseProps } from '../ProductResponse.types';
import { useProductResponseData } from './use-product-response-data.composable';

function makeProps(data: HarnessResponseData): ProductResponseProps {
  return reactive({ data });
}

describe('useProductResponseData', () => {
  it('sorts offers by ascending price', () => {
    const { offers } = useProductResponseData(
      makeProps({
        shopOffers: [
          { price: '$99.00', link: 'b' },
          { price: '$29.99', link: 'a' },
        ],
      }),
    );
    expect(offers.value.map((o) => o.price)).toEqual(['$29.99', '$99.00']);
  });

  it('caps the review videos at three', () => {
    const { videos } = useProductResponseData(
      makeProps({
        videoGalleryItems: [
          { videoUrl: '1' },
          { videoUrl: '2' },
          { videoUrl: '3' },
          { videoUrl: '4' },
        ],
      }),
    );
    expect(videos.value).toHaveLength(3);
  });

  it('counts the banner image plus gallery images', () => {
    const { imageCount } = useProductResponseData(
      makeProps({
        heroImageUrl: 'https://i.jpg',
        galleryItems: [{ imageUrl: 'g1' }, { imageUrl: 'g2' }],
      }),
    );
    expect(imageCount.value).toBe(3);
  });

  it('reports content when any field is present', () => {
    const { hasContent } = useProductResponseData(
      makeProps({ title: 'Product' }),
    );
    expect(hasContent.value).toBe(true);
  });

  it('reports no content for an empty response', () => {
    const { hasContent } = useProductResponseData(makeProps({}));
    expect(hasContent.value).toBe(false);
  });
});
