import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { describe, expect, it } from 'vitest';

import NewsResponse from './NewsResponse.vue';

function mountNewsResponse(data: Record<string, unknown>) {
  return mount(NewsResponse, {
    global: { plugins: [createPinia()] },
    props: { data: data as any },
  });
}

describe('NewsResponse', () => {
  it('renders headline, deck, and lead', () => {
    const wrapper = mountNewsResponse({
      headline: 'Headline',
      deck: 'Deck',
      lead: 'Lead paragraph',
    });

    expect(wrapper.find('h2').text()).toBe('Headline');
    expect(wrapper.text()).toContain('Deck');
    expect(wrapper.text()).toContain('Lead paragraph');
  });

  it('renders key findings', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      keyFindings: [{ text: 'Point one' }, { text: 'Point two' }],
    });

    expect(wrapper.text()).toContain('Point one');
    expect(wrapper.text()).toContain('Point two');
  });

  it('renders source links as bullet list', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      sources: [
        {
          title: 'Source A',
          url: 'https://a.com',
          sourceName: 'A News',
          date: 'Today',
          snippet: 'A snippet',
        },
      ],
    });

    expect(wrapper.text()).toContain('Source A');
    expect(wrapper.find('a').attributes('href')).toBe('https://a.com');
  });

  it('renders related story links as bullet list', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      relatedStories: [
        {
          title: 'Story 1',
          url: 'https://story.com',
          sourceName: 'S',
          date: '2026-07-10',
          imageUrl: 'https://img.com/a.jpg',
        },
      ],
    });

    expect(wrapper.text()).toContain('Related stories');
    expect(wrapper.text()).toContain('Story 1');
    expect(wrapper.find('a').attributes('href')).toBe('https://story.com');
  });

  it('renders empty state when there is no content', () => {
    const wrapper = mountNewsResponse({});

    expect(wrapper.text()).toContain('No results found');
  });
});
