import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import type { ActiveTab } from '../../../stores/app';
import TabButton from './TabButton.vue';

describe('TabButton', () => {
  it('renders label', () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'HTTP',
        tab: 'http' as ActiveTab,
        activeTab: 'debug' as ActiveTab,
        tint: 0,
      },
    });
    expect(wrapper.text()).toContain('HTTP');
  });

  it('emits click event', async () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'HTTP',
        tab: 'http' as ActiveTab,
        activeTab: 'debug' as ActiveTab,
        tint: 0,
      },
    });
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('shows active styling when active', () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'HTTP',
        tab: 'http' as ActiveTab,
        activeTab: 'http' as ActiveTab,
        tint: 0,
      },
    });
    expect(wrapper.find('button').attributes('style')).toContain('color-mix');
  });

  it('shows count badge when not active and count > 0', () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'Debug',
        tab: 'debug' as ActiveTab,
        activeTab: 'http' as ActiveTab,
        tint: 1,
        count: 5,
      },
    });
    expect(wrapper.find('.tab-button__indicator').exists()).toBe(true);
    expect(wrapper.text()).toContain('5');
  });

  it('does not show count badge when active', () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'Debug',
        tab: 'debug' as ActiveTab,
        activeTab: 'debug' as ActiveTab,
        tint: 1,
        count: 5,
      },
    });
    expect(wrapper.find('.tab-button__indicator').exists()).toBe(false);
  });

  it('caps count at 99+', () => {
    const wrapper = mount(TabButton, {
      props: {
        label: 'Debug',
        tab: 'debug' as ActiveTab,
        activeTab: 'http' as ActiveTab,
        tint: 1,
        count: 150,
      },
    });
    expect(wrapper.text()).toContain('99+');
  });
});
