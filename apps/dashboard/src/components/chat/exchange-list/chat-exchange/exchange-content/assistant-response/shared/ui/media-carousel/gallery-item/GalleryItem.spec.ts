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
  it('shows the skeleton until the image fires its load event', async () => {
    const { wrapper } = mountGalleryItem({ imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('replaces the skeleton with the error state on image failure', async () => {
    const { wrapper } = mountGalleryItem({ imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('button').classes()).toContain(
      'harness-gallery__trigger--error',
    );
  });

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
