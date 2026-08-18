import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import GalleryItem from './GalleryItem.vue';

function mountGalleryItem(item: { imageUrl: string; imageAlt?: string }) {
  const onImageClicked = vi.fn();
  return {
    wrapper: mount(GalleryItem, {
      props: { item },
      global: {
        provide: {
          [harnessImageClickedKey as symbol]: onImageClicked,
        },
      },
    }),
    onImageClicked,
  };
}

describe('GalleryItem', () => {
  it('renders an image with an encoded source', () => {
    const { wrapper } = mountGalleryItem({
      imageUrl: '/api/v1/storage/req-1/0?foo=bar baz',
      imageAlt: 'photo',
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe(
      encodeURI('/api/v1/storage/req-1/0?foo=bar baz'),
    );
  });

  it('emits the clicked item through the injected handler', async () => {
    const item = { imageUrl: '/a', imageAlt: 'a' };
    const { wrapper, onImageClicked } = mountGalleryItem(item);

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).toHaveBeenCalledWith(item);
  });

  it('does not render when there is no imageUrl', () => {
    const { wrapper } = mountGalleryItem({ imageUrl: '' });

    expect(wrapper.find('li').exists()).toBe(false);
  });
});
