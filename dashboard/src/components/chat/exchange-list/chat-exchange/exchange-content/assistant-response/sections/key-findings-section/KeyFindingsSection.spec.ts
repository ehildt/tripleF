import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import KeyFindingsSection from './KeyFindingsSection.vue';

describe('KeyFindingsSection', () => {
  it('renders the section title when provided', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: { items: [{ text: 'First' }], title: 'Key findings' },
    });

    expect(wrapper.find('h3').text()).toBe('Key findings');
  });

  it('renders no title when omitted (embedded use)', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: { items: [{ text: 'First' }] },
    });

    expect(wrapper.find('h3').exists()).toBe(false);
  });

  it('assigns a cycling color to each tag via the --stat-tile-color variable', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: {
        items: Array.from({ length: 10 }, (_, index) => ({
          text: `Finding ${index}`,
        })),
      },
    });

    const items = wrapper.findAll('li');
    expect(items[0].attributes('style')).toContain(
      '--stat-tile-color: var(--color-accent-primary)',
    );
    expect(items[5].attributes('style')).toContain(
      '--stat-tile-color: var(--color-status-info)',
    );
    // The 10th tag wraps back to the start of the cycle.
    expect(items[9].attributes('style')).toContain(
      '--stat-tile-color: var(--color-accent-primary)',
    );
  });

  it('renders nothing when items is empty', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: { items: [] },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders valid key finding entries as tags', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: { items: [{ text: 'First' }, { text: 'Second' }] },
    });

    expect(wrapper.findAll('li')).toHaveLength(2);
    expect(wrapper.text()).toContain('First');
    expect(wrapper.text()).toContain('Second');
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(KeyFindingsSection, {
      props: {
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
        items: ['plain', '', null] as unknown as never[],
      },
    });

    expect(wrapper.find('ul').exists()).toBe(false);
  });
});
