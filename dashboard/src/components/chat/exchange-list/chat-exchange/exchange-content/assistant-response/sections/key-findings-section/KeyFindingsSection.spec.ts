import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import KeyFindingsSection from './KeyFindingsSection.vue';

describe('KeyFindingsSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: { title: 'Findings', items: [] },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders valid key finding entries', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: {
        title: 'Findings',
        items: [{ text: 'First' }, { text: 'Second' }],
      },
    });

    expect(wrapper.find('h3').text()).toBe('Findings');
    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('First');
    expect(wrapper.text()).toContain('Second');
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: {
        title: 'Findings',
        items: [
          'plain string',
          { text: 'Valid' },
          { text: '' },
          null as unknown as never,
        ],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.text()).toContain('Valid');
    expect(wrapper.text()).not.toContain('plain string');
  });

  it('renders nothing when all items are malformed', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: {
        title: 'Findings',
        items: ['plain', '', null] as unknown as never[],
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });
});
