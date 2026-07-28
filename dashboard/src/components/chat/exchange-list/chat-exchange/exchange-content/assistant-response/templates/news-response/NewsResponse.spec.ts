import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewsResponse from './NewsResponse.vue';

function mountNewsResponse(data: Record<string, unknown>) {
  return mount(NewsResponse, {
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

    expect(wrapper.find('h1').text()).toBe('Headline');
    expect(wrapper.text()).toContain('Deck');
    expect(wrapper.text()).toContain('Lead paragraph');
  });

  it('renders key points', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      keyPoints: [{ text: 'Point one' }, { text: 'Point two' }],
    });

    expect(wrapper.text()).toContain('Key Points');
    expect(wrapper.text()).toContain('Point one');
    expect(wrapper.text()).toContain('Point two');
  });

  it('renders meta bar pills for publish date, read time, and byline', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      byline: 'Reuters',
      publishDate: '2026-07-11',
      readTime: '3 min read',
    });

    const pills = wrapper.findAll('.pill');
    const pillTexts = pills.map((pill) => pill.text());

    expect(pillTexts).toContain('2026-07-11');
    expect(pillTexts).toContain('3 min read');
    expect(pillTexts).toContain('Reuters');
  });

  it('renders the dateline and byline combined in a single pill', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
      dateline: 'Berlin',
      byline: 'Reuters',
    });

    const pillTexts = wrapper.findAll('.pill').map((pill) => pill.text());

    expect(pillTexts).toContain('Berlin · Reuters');
  });

  it('renders no meta pills when no meta fields are present', () => {
    const wrapper = mountNewsResponse({
      headline: 'H',
    });

    expect(wrapper.findAll('.pill')).toHaveLength(0);
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

    expect(wrapper.text()).toContain('Related Stories');
    expect(wrapper.text()).toContain('Story 1');
    expect(wrapper.find('a').attributes('href')).toBe('https://story.com');
  });

  it('renders empty state when there is no content', () => {
    const wrapper = mountNewsResponse({});

    expect(wrapper.text()).toContain('No results found');
  });
});
