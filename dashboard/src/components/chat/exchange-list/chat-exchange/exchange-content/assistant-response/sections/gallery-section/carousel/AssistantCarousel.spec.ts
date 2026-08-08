import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import AssistantCarousel from './AssistantCarousel.vue';

function mountCarousel(items: { imageUrl: string; imageAlt?: string }[]) {
  return mount(AssistantCarousel, {
    props: { items },
    global: {
      provide: {
        [harnessImageClickedKey as symbol]: vi.fn(),
      },
    },
  });
}

describe('AssistantCarousel', () => {
  it('renders carousel controls and a dot per image', () => {
    const wrapper = mountCarousel([
      { imageUrl: '/a', imageAlt: 'a' },
      { imageUrl: '/b', imageAlt: 'b' },
      { imageUrl: '/c', imageAlt: 'c' },
    ]);

    expect(wrapper.find('.carousel-content--count-3plus').exists()).toBe(true);
    expect(wrapper.findAll('.harness-gallery__item')).toHaveLength(3);
    expect(wrapper.findAll('.carousel-header__dot')).toHaveLength(3);
    expect(
      wrapper.find('.carousel-content__button--prev').attributes('disabled'),
    ).toBeDefined();
    expect(
      wrapper.find('.carousel-content__button--next').attributes('disabled'),
    ).toBeUndefined();
  });

  it('uses the 2-image count class for two items', () => {
    const wrapper = mountCarousel([
      { imageUrl: '/a', imageAlt: 'a' },
      { imageUrl: '/b', imageAlt: 'b' },
    ]);

    expect(wrapper.find('.carousel-content--count-2').exists()).toBe(true);
  });

  it('marks the first item active by default', () => {
    const wrapper = mountCarousel([
      { imageUrl: '/a', imageAlt: 'a' },
      { imageUrl: '/b', imageAlt: 'b' },
    ]);

    const items = wrapper.findAll('.harness-gallery__item');
    expect(items[0].classes()).toContain('harness-gallery__item--active');
    expect(items[1].classes()).not.toContain('harness-gallery__item--active');
  });
});
