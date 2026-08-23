import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { computed } from 'vue';

import { mediaPresentationsKey } from '@/types/harness-response-data.model';

import VideoGallerySection from './VideoGallerySection.vue';

const VIDEOS = [{ videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }];

function mountSection(presentation: 'gallery' | 'list' = 'list') {
  return mount(VideoGallerySection, {
    props: { items: VIDEOS, title: 'Videos' },
    global: {
      provide: {
        [mediaPresentationsKey as symbol]: computed(() => ({
          image: 'gallery',
          video: presentation,
        })),
      },
    },
  });
}

describe('VideoGallerySection', () => {
  it('renders nothing when there are no items', () => {
    const wrapper = mount(VideoGallerySection, { props: { items: [] } });
    expect(wrapper.find('.video-gallery-section').exists()).toBe(false);
  });

  it('renders the card grid by default (list presentation)', () => {
    const wrapper = mountSection('list');
    expect(wrapper.find('.video-gallery').exists()).toBe(true);
    expect(wrapper.find('.harness-carousel').exists()).toBe(false);
  });

  it('renders the carousel when the video presentation is gallery', () => {
    const wrapper = mountSection('gallery');
    expect(wrapper.find('.harness-carousel').exists()).toBe(true);
    expect(wrapper.find('.video-gallery').exists()).toBe(false);
  });
});
