import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import NewsMetaSection from './NewsMetaSection.vue';

describe('NewsMetaSection', () => {
  it('renders a single consolidated meta line with labels', () => {
    const wrapper = mount(NewsMetaSection, {
      props: {
        byline: 'Reuters',
        publishDate: '2026-07-11',
        readTime: '3 min read',
      },
    });

    expect(wrapper.find('.news-meta-section').exists()).toBe(true);
    expect(wrapper.text()).toBe(
      'Published: 2026-07-11 · Read time: 3 min read · By Reuters',
    );
  });

  it('includes the dateline when provided', () => {
    const wrapper = mount(NewsMetaSection, {
      props: {
        dateline: '2026-07-11, Gaza',
        byline: 'Reuters',
      },
    });

    expect(wrapper.text()).toBe('2026-07-11, Gaza · By Reuters');
  });

  it('hides the meta line when no meta fields are present', () => {
    const wrapper = mount(NewsMetaSection, {
      props: {},
    });

    expect(wrapper.find('.news-meta-section').exists()).toBe(false);
  });
});
