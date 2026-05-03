import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import BraveProviderIcon from './BraveProviderIcon.vue';

describe('BraveProviderIcon', () => {
  it('renders as an svg icon', () => {
    const wrapper = mount(BraveProviderIcon);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('adds active class when active', () => {
    const wrapper = mount(BraveProviderIcon, {
      props: { active: true },
    });
    expect(wrapper.find('.brave-provider-icon--active').exists()).toBe(true);
  });
});
