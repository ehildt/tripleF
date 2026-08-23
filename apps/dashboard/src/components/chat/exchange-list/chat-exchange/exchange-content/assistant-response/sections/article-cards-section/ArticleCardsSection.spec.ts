import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import ArticleCardsSection from './ArticleCardsSection.vue';

describe('ArticleCardsSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(ArticleCardsSection, {
      props: { title: 'Cards', items: [] },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders card links with titles and descriptions', () => {
    const wrapper = mount(ArticleCardsSection, {
      props: {
        title: 'Cards',
        items: [
          {
            title: 'Card A',
            description: 'Description A',
            url: 'https://a.com',
            linkLabel: 'Read',
          },
        ],
      },
    });

    expect(wrapper.find('h3').text()).toBe('Cards');
    expect(wrapper.text()).toContain('Card A');
    expect(wrapper.text()).toContain('Description A');
    expect(wrapper.find('a').attributes('href')).toBe('https://a.com');
    expect(wrapper.find('a').text()).toBe('Read');
  });

  it('renders description-only cards', () => {
    const wrapper = mount(ArticleCardsSection, {
      props: {
        items: [{ description: 'No link' }],
      },
    });

    expect(wrapper.findAll('.card')).toHaveLength(1);
    expect(wrapper.text()).toContain('No link');
    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(ArticleCardsSection, {
      props: {
        title: 'Cards',
        items: [
          'https://ignored.com',
          { title: 'Valid', url: 'https://valid.com' },
          null as unknown as never,
          {},
        ],
      },
    });

    expect(wrapper.findAll('.card')).toHaveLength(1);
    expect(wrapper.text()).toContain('Valid');
    expect(wrapper.text()).not.toContain('ignored.com');
  });

  it('renders nothing when all items are malformed', () => {
    const wrapper = mount(ArticleCardsSection, {
      props: {
        title: 'Cards',
        items: ['plain', null, {}] as unknown as never[],
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });
});
