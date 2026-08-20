import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { RelatedStory } from '@/types/harness-response-data.model';

import RelatedStoryCard from './RelatedStoryCard.vue';

function mountCard(item: Partial<RelatedStory>) {
  return mount(RelatedStoryCard, {
    props: { item: item as RelatedStory },
  });
}

describe('RelatedStoryCard', () => {
  it('renders the story title and source meta', () => {
    const wrapper = mountCard({
      title: 'Story title',
      sourceName: 'Example News',
      date: '2025-01-01',
    });

    expect(wrapper.text()).toContain('Story title');
    expect(wrapper.text()).toContain('Example News');
    expect(wrapper.text()).toContain('2025-01-01');
  });

  it('renders the card as a link when a url exists', () => {
    const wrapper = mountCard({ title: 'T', url: 'https://example.com/a' });

    expect(wrapper.find('a.related-story__card').exists()).toBe(true);
    expect(wrapper.find('a.related-story__card').attributes('href')).toBe(
      'https://example.com/a',
    );
  });

  it('renders an inert wrapper when there is no url', () => {
    const wrapper = mountCard({ title: 'T' });

    expect(wrapper.find('a.related-story__card').exists()).toBe(false);
    expect(wrapper.find('.related-story__card').exists()).toBe(true);
  });

  it('shows the skeleton until the image fires its load event', async () => {
    const wrapper = mountCard({ title: 'T', imageUrl: '/a.png' });

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(true);

    await wrapper.find('img').trigger('load');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('img').classes()).toContain('async-image__img--loaded');
  });

  it('replaces the skeleton with the error fallback on image failure', async () => {
    const wrapper = mountCard({ title: 'T', imageUrl: '/missing.png' });

    await wrapper.find('img').trigger('error');

    expect(wrapper.find('.async-image__skeleton').exists()).toBe(false);
    expect(wrapper.find('.async-image__error').exists()).toBe(true);
  });

  it('omits the media block entirely when there is no imageUrl', () => {
    const wrapper = mountCard({ title: 'T' });

    expect(wrapper.find('.related-story__media').exists()).toBe(false);
  });
});
