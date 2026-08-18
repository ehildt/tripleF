import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { MediaItem } from '@/types/harness-response-data.model';
import { harnessImageClickedKey } from '@/types/harness-response-data.model';

import {
  clearActivePlayback,
  setActivePlayback,
} from '../../../composables/video-playback.state';
import VideoCarouselItem from './video-carousel-item/VideoCarouselItem.vue';
import AssistantCarousel from './AssistantCarousel.vue';

function mountCarousel(items: MediaItem[]) {
  return mount(AssistantCarousel, {
    props: { items },
    global: {
      provide: {
        [harnessImageClickedKey as symbol]: vi.fn(),
      },
    },
  });
}

afterEach(() => {
  clearActivePlayback();
});

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

  it('renders video slides for video items', () => {
    const wrapper = mountCarousel([
      { imageUrl: '/a', imageAlt: 'a' },
      { videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', title: 'V' },
    ]);

    expect(wrapper.findAll('.video-carousel-item')).toHaveLength(1);
    expect(wrapper.find('.video-carousel-item__title').text()).toBe('V');
  });

  it('marks only the centered video slide as active', () => {
    const wrapper = mountCarousel([
      { videoUrl: 'https://www.youtube.com/watch?v=a', title: 'A' },
      { videoUrl: 'https://www.youtube.com/watch?v=b', title: 'B' },
    ]);

    const slides = wrapper.findAllComponents(VideoCarouselItem);
    expect(slides[0].props('active')).toBe(true);
    expect(slides[1].props('active')).toBe(false);
  });

  it('marks the dot of the currently playing video as playing', () => {
    setActivePlayback('https://www.youtube.com/watch?v=b');
    const wrapper = mountCarousel([
      { videoUrl: 'https://www.youtube.com/watch?v=a', title: 'A' },
      { videoUrl: 'https://www.youtube.com/watch?v=b', title: 'B' },
      { videoUrl: 'https://www.youtube.com/watch?v=c', title: 'C' },
    ]);

    const dots = wrapper.findAll('.carousel-header__dot');
    expect(dots[1].classes()).toContain('carousel-header__dot--playing');
    expect(dots[0].classes()).not.toContain('carousel-header__dot--playing');
    expect(dots[2].classes()).not.toContain('carousel-header__dot--playing');
  });

  it('centers the currently playing video when it mounts', () => {
    setActivePlayback('https://www.youtube.com/watch?v=b');
    const wrapper = mountCarousel([
      { videoUrl: 'https://www.youtube.com/watch?v=a', title: 'A' },
      { videoUrl: 'https://www.youtube.com/watch?v=b', title: 'B' },
      { videoUrl: 'https://www.youtube.com/watch?v=c', title: 'C' },
    ]);

    const slides = wrapper.findAllComponents(VideoCarouselItem);
    expect(slides[1].props('active')).toBe(true);
    expect(slides[0].props('active')).toBe(false);
    expect(slides[2].props('active')).toBe(false);
  });

  it('starts at the first slide when no video is playing', () => {
    const wrapper = mountCarousel([
      { videoUrl: 'https://www.youtube.com/watch?v=a', title: 'A' },
      { videoUrl: 'https://www.youtube.com/watch?v=b', title: 'B' },
    ]);

    const slides = wrapper.findAllComponents(VideoCarouselItem);
    expect(slides[0].props('active')).toBe(true);
    expect(slides[1].props('active')).toBe(false);
  });
});
