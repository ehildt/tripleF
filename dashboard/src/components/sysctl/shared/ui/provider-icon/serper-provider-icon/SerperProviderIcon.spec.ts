import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import SerperProviderIcon from './SerperProviderIcon.vue';

describe('SerperProviderIcon', () => {
  it('renders as an svg icon', () => {
    const wrapper = mount(SerperProviderIcon);
    expect(wrapper.find('svg').exists()).toBe(true);
  });

  it('adds active class when active', () => {
    const wrapper = mount(SerperProviderIcon, {
      props: { active: true },
    });
    expect(wrapper.find('.serper-provider-icon--active').exists()).toBe(true);
  });
});
