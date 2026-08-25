import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { computed } from 'vue';

import {
  harnessImageClickedKey,
  mediaPresentationsKey,
} from '@/types/harness-response-data.model';

import GallerySection from './GallerySection.vue';

let activePinia: ReturnType<typeof createPinia>;

function mountSection(
  items: { imageUrl: string }[],
  title?: string,
  presentation: 'gallery' | 'list' = 'gallery',
) {
  return mount(GallerySection, {
    props: { title, items },
    global: {
      plugins: [activePinia],
      provide: {
        [harnessImageClickedKey as symbol]: vi.fn(),
        [mediaPresentationsKey as symbol]: computed(() => ({
          image: presentation,
          video: 'list',
        })),
      },
    },
  });
}

describe('GallerySection', () => {
  beforeEach(() => {
    activePinia = createPinia();
    setActivePinia(activePinia);
  });
  it('renders nothing when there are no items', () => {
    const wrapper = mountSection([]);
    expect(wrapper.find('.harness-gallery-section').exists()).toBe(false);
  });

  it('renders no bare title when there are no items', () => {
    const wrapper = mountSection([], 'Images');
    expect(wrapper.find('h3').exists()).toBe(false);
  });

  it('renders a single-image gallery without carousel controls', () => {
    const wrapper = mountSection([{ imageUrl: '/a' }]);

    expect(wrapper.find('.harness-gallery--single').exists()).toBe(true);
    expect(wrapper.find('.harness-carousel').exists()).toBe(false);
  });

  it('renders a carousel when there are multiple items', () => {
    const wrapper = mountSection([{ imageUrl: '/a' }, { imageUrl: '/b' }]);

    expect(wrapper.find('.harness-carousel').exists()).toBe(true);
    expect(wrapper.find('.harness-gallery--single').exists()).toBe(false);
  });

  it('renders the title when provided', () => {
    const wrapper = mountSection([{ imageUrl: '/a' }], 'Images');

    expect(wrapper.find('h3').text()).toBe('Images');
  });

  it('renders a tile list when the image presentation is list', () => {
    const wrapper = mountSection(
      [{ imageUrl: '/a' }, { imageUrl: '/b' }],
      'Images',
      'list',
    );

    expect(wrapper.find('.image-grid').exists()).toBe(true);
    expect(wrapper.find('.harness-carousel').exists()).toBe(false);
    expect(wrapper.findAll('.image-item')).toHaveLength(2);
  });
});
