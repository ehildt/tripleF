import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';

import ProductSpotlightMedia from './ProductSpotlightMedia.vue';

const selectedSlide = {
  imageUrl: 'https://example.com/hero.jpg',
  imageAlt: 'Hero',
  title: 'Product',
};

describe('ProductSpotlightMedia', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('renders a clickable image trigger when selectedSlide is provided', () => {
    const wrapper = mount(ProductSpotlightMedia, {
      props: { selectedSlide },
    });
    expect(wrapper.find('.spotlight__trigger').exists()).toBe(true);
    expect(wrapper.find('.spotlight__trigger img').attributes('src')).toBe(
      selectedSlide.imageUrl,
    );
  });

  it('emits imageClicked when the trigger is clicked', async () => {
    const wrapper = mount(ProductSpotlightMedia, {
      props: { selectedSlide },
    });
    await wrapper.find('.spotlight__trigger').trigger('click');
    expect(wrapper.emitted('imageClicked')).toEqual([[selectedSlide]]);
  });

  it('renders a placeholder when there is no media', () => {
    const wrapper = mount(ProductSpotlightMedia, {
      props: {},
    });
    expect(wrapper.find('.spotlight__placeholder').exists()).toBe(true);
  });

  it('renders a floating video figure in video mode', () => {
    const wrapper = mount(ProductSpotlightMedia, {
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoTitle: 'Review',
      },
    });
    expect(wrapper.find('.floating-video-figure').exists()).toBe(true);
    expect(wrapper.find('.spotlight__playlist-toggle').exists()).toBe(true);
  });

  it('emits togglePlaylist when the playlist button is clicked', async () => {
    const wrapper = mount(ProductSpotlightMedia, {
      props: {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        videoTitle: 'Review',
      },
    });
    await wrapper.find('.spotlight__playlist-toggle').trigger('click');
    expect(wrapper.emitted('togglePlaylist')).toBeTruthy();
  });
});
