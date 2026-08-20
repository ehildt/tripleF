import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import ImageListItem from './ImageListItem.vue';

function mountItem(item: { imageUrl: string; imageAlt?: string }) {
  const onImageClicked = vi.fn();
  return {
    wrapper: mount(ImageListItem, {
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

describe('ImageListItem', () => {
  it('shows the skeleton until the image fires its load event', async () => {
    const { wrapper } = mountItem({ imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);
    expect(wrapper.find('img').classes()).not.toContain(
      'async-image__img--loaded',
    );

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('hides the skeleton and marks the tile as failed on image error', async () => {
    const { wrapper } = mountItem({ imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--error');
    expect(wrapper.find('button').classes()).toContain(
      'image-item__trigger--error',
    );
  });

  it('does not emit the click once the image failed to load', async () => {
    const { wrapper, onImageClicked } = mountItem({ imageUrl: '/missing.png' });
    await wrapper.find('img').trigger('error');

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).not.toHaveBeenCalled();
  });

  it('emits the clicked item through the injected handler', async () => {
    const item = { imageUrl: '/a', imageAlt: 'a' };
    const { wrapper, onImageClicked } = mountItem(item);
    await wrapper.find('img').trigger('load');

    await wrapper.find('button').trigger('click');

    expect(onImageClicked).toHaveBeenCalledWith(item);
  });
});
