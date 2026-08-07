import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import SummaryResponse from './SummaryResponse.vue';

function mountSummaryResponse(data: Record<string, unknown>) {
  return mount(SummaryResponse, {
    global: { plugins: [createPinia()] },
    props: { data: data as any },
  });
}

describe('SummaryResponse', () => {
  it('renders hero fields', () => {
    const wrapper = mountSummaryResponse({
      title: 'Summary',
      subtitle: 'Subtitle',
    });

    expect(wrapper.text()).toContain('Summary');
    expect(wrapper.text()).toContain('Subtitle');
  });

  it('renders summary paragraph', () => {
    const wrapper = mountSummaryResponse({
      title: 'Summary',
      summary: 'This is the recap.',
    });

    expect(wrapper.text()).toContain('This is the recap.');
  });

  it('renders key findings', () => {
    const wrapper = mountSummaryResponse({
      title: 'Summary',
      keyFindings: [{ text: 'Point one' }, { text: 'Point two' }],
    });

    expect(wrapper.text()).toContain('Point one');
    expect(wrapper.text()).toContain('Point two');
  });

  it('renders source links', () => {
    const wrapper = mountSummaryResponse({
      title: 'Summary',
      sources: [{ title: 'Source A', url: 'https://a.com' }],
    });

    expect(wrapper.text()).toContain('Source A');
    expect(wrapper.find('a').attributes('href')).toBe('https://a.com');
  });

  it('renders media sections when provided', () => {
    const wrapper = mountSummaryResponse({
      title: 'Summary',
      summary: 'Recap text.',
      heroImageUrl: 'https://example.com/hero.jpg',
      heroImageAlt: 'Hero',
      heroCaption: 'Hero caption',
      galleryItems: [
        {
          imageUrl: 'https://example.com/g1.jpg',
          imageAlt: 'G1',
          title: 'Gallery 1',
          caption: 'Caption 1',
        },
        {
          imageUrl: 'https://example.com/g2.jpg',
          imageAlt: 'G2',
          title: 'Gallery 2',
          caption: 'Caption 2',
        },
      ],
      videoGalleryItems: [
        { videoUrl: 'https://example.com/video.mp4', title: 'Video' },
      ],
    });

    expect(wrapper.find('figure').exists()).toBe(true);
    expect(wrapper.text()).toContain('Recap text.');
    expect(wrapper.text()).toContain('Caption 1');
    expect(wrapper.text()).toContain('Video');
  });

  it('renders empty state when there is no content', () => {
    const wrapper = mountSummaryResponse({});
    expect(wrapper.text()).toContain('No results found');
  });
});
