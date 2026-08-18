import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { computed } from 'vue';

import type { CollapsedSections } from '@/types/harness-response-data.model';
import { sectionCollapsedKey } from '@/types/harness-response-data.model';

import SourcesSection from './SourcesSection.vue';

const COLLAPSED_SOURCES: CollapsedSections = {
  sources: true,
  keyFindings: false,
  internationalCoverage: false,
};

describe('SourcesSection', () => {
  it('renders nothing when items is empty', () => {
    const wrapper = mount(SourcesSection, {
      props: { items: [] },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('renders source links with titles', () => {
    const wrapper = mount(SourcesSection, {
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
  });

  it('renders a title-only source when url is missing', () => {
    const wrapper = mount(SourcesSection, {
      props: {
        items: [{ title: 'Untitled source' }],
      },
    });

    expect(wrapper.findAll('li')).toHaveLength(1);
    expect(wrapper.text()).toContain('Untitled source');
    expect(wrapper.find('a').exists()).toBe(false);
  });

  it('filters out malformed entries such as plain strings', () => {
    const wrapper = mount(SourcesSection, {
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
    const wrapper = mount(SourcesSection, {
      props: {
        items: ['plain', null, {}] as unknown as never[],
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });

  it('hides when the sources section type is collapsed from the prompt bar', () => {
    const wrapper = mount(SourcesSection, {
      props: { items: [{ title: 'Source A', url: 'https://a.com' }] },
      global: {
        provide: {
          [sectionCollapsedKey]: computed(() => COLLAPSED_SOURCES),
        },
      },
    });

    expect(wrapper.find('section').exists()).toBe(false);
  });
});
