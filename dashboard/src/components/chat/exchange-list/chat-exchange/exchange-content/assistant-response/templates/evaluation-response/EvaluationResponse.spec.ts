import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import EvaluationResponse from './EvaluationResponse.vue';

function mountEvaluationResponse(data: Record<string, unknown>) {
  return mount(EvaluationResponse, {
    global: { plugins: [createPinia()] },
    props: { data: data as any },
  });
}

describe('EvaluationResponse', () => {
  it('renders hero fields', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      subtitle: 'Subtitle',
    });

    expect(wrapper.text()).toContain('Evaluation');
    expect(wrapper.text()).toContain('Subtitle');
  });

  it('renders subject and verdict', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      subject: 'NTE',
      verdict: 'Promising',
    });

    expect(wrapper.text()).toContain('Subject:');
    expect(wrapper.text()).toContain('NTE');
    expect(wrapper.text()).toContain('Verdict:');
    expect(wrapper.text()).toContain('Promising');
  });

  it('renders reasoning', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      reasoning: 'Because it looks good.',
    });

    expect(wrapper.text()).toContain('Because it looks good.');
  });

  it('renders strengths, weaknesses, and recommendations', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      strengths: [{ text: 'Fast' }],
      weaknesses: [{ text: 'Buggy' }],
      recommendations: [{ text: 'Patch it' }],
    });

    expect(wrapper.text()).toContain('Fast');
    expect(wrapper.text()).toContain('Buggy');
    expect(wrapper.text()).toContain('Patch it');
  });

  it('renders source links', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      sources: [{ title: 'Source A', url: 'https://a.com' }],
    });

    expect(wrapper.text()).toContain('Source A');
    expect(wrapper.find('a').attributes('href')).toBe('https://a.com');
  });

  it('renders media sections when provided', () => {
    const wrapper = mountEvaluationResponse({
      title: 'Evaluation',
      subject: 'NTE',
      heroImageUrl: 'https://example.com/hero.jpg',
      heroImageAlt: 'Hero',
      galleryItems: [
        {
          imageUrl: 'https://example.com/g1.jpg',
          imageAlt: 'G1',
          title: 'Gallery 1',
          caption: 'Caption 1',
        },
      ],
      videoGalleryItems: [
        { videoUrl: 'https://example.com/video.mp4', title: 'Video' },
      ],
    });

    expect(wrapper.find('figure').exists()).toBe(true);
    expect(wrapper.text()).toContain('Caption 1');
    expect(wrapper.text()).toContain('Video');
  });

  it('renders empty state when there is no content', () => {
    const wrapper = mountEvaluationResponse({});
    expect(wrapper.text()).toContain('No results found');
  });
});
