import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import RelatedStoriesSection from './RelatedStoriesSection.vue';

describe('RelatedStoriesSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(RelatedStoriesSection, { props: { items: [] } });
    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders story links as a grid of cards', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [
          { title: 'Story A', url: 'https://a.com' },
          { title: 'Story B', url: 'https://b.com' },
        ],
      },
    });

    expect(wrapper.find('h3').text()).toBe('Related Stories');
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].find('a').attributes('href')).toBe('https://a.com');
    expect(items[0].text()).toContain('Story A');
  });

  it('shows source and date metadata when available', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [
          {
            title: 'Story A',
            url: 'https://a.com',
            sourceName: 'A News',
            date: 'Today',
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('Story A');
    expect(wrapper.text()).toContain('A News · Today');
  });

  it('falls back to the raw url when no title is provided', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [{ url: 'https://example.com' }],
      },
    });

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.text()).toBe('https://example.com');
  });

  it('renders thumbnails when imageUrl is provided', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [
          {
            title: 'Story A',
            url: 'https://a.com',
            imageUrl: 'https://a.com/image.jpg',
          },
        ],
      },
    });

    const img = wrapper.find('img');
    expect(img.exists()).toBe(true);
    expect(img.attributes('src')).toBe('https://a.com/image.jpg');
    expect(img.attributes('alt')).toBe('Story A');
  });

  it('uses a single-column layout for one item', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [{ title: 'Solo Story', url: 'https://solo.com' }],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.find('.related-stories--single').exists()).toBe(true);
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: [
          'https://ignored.com',
          { title: 'Valid', url: 'https://valid.com' },
          null as unknown as never,
          {},
        ],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.text()).toContain('Valid');
    expect(wrapper.text()).not.toContain('ignored.com');
  });

  it('renders nothing when all items are malformed', () => {
    const wrapper = mount(RelatedStoriesSection, {
      props: {
        items: ['plain', null, {}] as unknown as never[],
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });
});
