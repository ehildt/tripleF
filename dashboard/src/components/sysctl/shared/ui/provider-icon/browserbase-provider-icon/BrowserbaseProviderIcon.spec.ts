import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BrowserbaseProviderIcon from './BrowserbaseProviderIcon.vue';

describe('BrowserbaseProviderIcon', () => {
  it('renders as an svg icon', () => {
    const wrapper = mount(BrowserbaseProviderIcon);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('adds active class when active', () => {
    const wrapper = mount(BrowserbaseProviderIcon, {
      props: { active: true },
    });
    expect(wrapper.find('.browserbase-provider-icon--active').exists()).toBe(
      true,
    );
  });
});
