import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SearxngProviderIcon from './SearxngProviderIcon.vue';

describe('SearxngProviderIcon', () => {
  it('renders as an svg icon', () => {
    const wrapper = mount(SearxngProviderIcon);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('adds active class when active', () => {
    const wrapper = mount(SearxngProviderIcon, {
      props: { active: true },
    });
    expect(wrapper.find('.searxng-provider-icon--active').exists()).toBe(true);
  });
});
