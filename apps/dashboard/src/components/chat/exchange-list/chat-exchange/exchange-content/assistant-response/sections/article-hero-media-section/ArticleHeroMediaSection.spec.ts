import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import {
  closeLaunchedVideo,
  launchedVideo,
} from '../../composables/video-playback.state';
import ArticleHeroMediaSection from './ArticleHeroMediaSection.vue';

describe('ArticleHeroMediaSection', () => {
  it('launches the app-level player when the hero video poster is engaged', async () => {
    const wrapper = mount(ArticleHeroMediaSection, {
      global: { plugins: [createPinia()] },
      props: {
        heroVideoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });

    // Figures never mount a player themselves: the poster launches the
    // app-level floating player, which overlays the figure via CSS alone.
    expect(wrapper.find('.floating-video-figure__poster').exists()).toBe(true);
    expect(launchedVideo.value).toBeNull();

    await wrapper.find('.floating-video-figure__poster').trigger('click');

    expect(wrapper.find('iframe').exists()).toBe(false);
    expect(launchedVideo.value?.videoUrl).toBe(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    );

    closeLaunchedVideo();
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
