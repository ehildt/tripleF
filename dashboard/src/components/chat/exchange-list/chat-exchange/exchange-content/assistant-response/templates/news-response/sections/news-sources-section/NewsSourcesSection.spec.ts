import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewsSourcesSection from './NewsSourcesSection.vue';

describe('NewsSourcesSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(NewsSourcesSection, { props: { items: [] } });
    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders source links as a bullet list', () => {
    const wrapper = mount(NewsSourcesSection, {
      props: {
        items: [
          { title: 'Source A', url: 'https://a.com' },
          { title: 'Source B', url: 'https://b.com' },
        ],
      },
    });

    expect(wrapper.find('h3').text()).toBe('Sources');
    const items = wrapper.findAll('li');
    expect(items).toHaveLength(2);
    expect(items[0].find('a').attributes('href')).toBe('https://a.com');
    expect(items[0].text()).toContain('Source A');
    expect(items[1].find('a').attributes('href')).toBe('https://b.com');
  });

  it('falls back to the raw url when no title is provided', () => {
    const wrapper = mount(NewsSourcesSection, {
      props: {
        items: [{ url: 'https://example.com' }],
      },
    });

    const link = wrapper.find('a');
    expect(link.attributes('href')).toBe('https://example.com');
    expect(link.text()).toBe('https://example.com');
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(NewsSourcesSection, {
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
    const wrapper = mount(NewsSourcesSection, {
      props: {
        items: ['plain', null, {}] as unknown as never[],
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });
});
