import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import ArticleHeroMediaSection from './ArticleHeroMediaSection.vue';

describe('ArticleHeroMediaSection', () => {
  it('renders an iframe once an embeddable hero video is engaged', async () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {
        heroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });

    // The player lazy-mounts: only after the figure is in view or engaged.
    expect(wrapper.find('iframe').exists()).toBe(false);

    await wrapper.find('.floating-video-figure__media').trigger('pointerdown');

    const iframe = wrapper.find('iframe');
    expect(iframe.exists()).toBe(true);
    expect(iframe.attributes('src')).toContain(
      'https://www.youtube.com/embed/dQw4w9WgXcQ',
    );
  });

  it('renders a fallback link when heroVideoUrl is not embeddable', () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {
        heroVideoUrl: 'https://www.tiktok.com/@nasa/video/123456',
      },
    });

    expect(wrapper.find('iframe').exists()).toBe(false);
    const link = wrapper.find('.floating-video-figure__fallback');
    expect(link.exists()).toBe(true);
    expect(link.attributes('href')).toBe(
      'https://www.tiktok.com/@nasa/video/123456',
    );
    expect(link.text()).toBe('Watch on source ↗');
  });

  it('renders nothing when no video or image is provided', () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {},
    });
    expect(wrapper.find('figure').exists()).toBe(false);
  });

  it('renders a hero image when heroImageUrl is provided', () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {
        heroImageUrl: 'https://example.com/hero.jpg',
        heroImageAlt: 'Hero',
      },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://example.com/hero.jpg');
    expect(img.attributes('alt')).toBe('Hero');
  });

  it('renders the caption when provided', () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {
        heroImageUrl: 'https://example.com/hero.jpg',
        heroCaption: 'A caption',
      },
    });

    expect(wrapper.text()).toContain('A caption');
  });
});
