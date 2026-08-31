import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import type { Component } from 'vue';

import ExpandableList from './ExpandableList.vue';

function mountList(props: {
  isExpanded: boolean;
  hasItems: boolean;
  showDivider?: boolean;
}) {
  return mount(ExpandableList as Component, {
    props,
    slots: { default: '<div class="list-item">item</div>' },
  });
}

describe('ExpandableList', () => {
  it('hides the divider and stays expanded when showDivider is false', () => {
    const wrapper = mountList({
      isExpanded: false,
      hasItems: true,
      showDivider: false,
    });

    // No separator, no toggle — the list must remain visible so a fresh
    // (collapsed) conversation list can never become unreachable.
    expect(wrapper.find('.expandable-divider').exists()).toBe(false);
    expect(wrapper.find('.expandable-divider__line').exists()).toBe(false);
    expect(wrapper.find('.list-item').exists()).toBe(true);
  });

  it('shows the divider and respects isExpanded when showDivider is true', () => {
    const collapsed = mountList({
      isExpanded: false,
      hasItems: true,
      showDivider: true,
    });
    expect(collapsed.find('.expandable-divider').exists()).toBe(true);
    expect(collapsed.find('.expandable-divider__line').exists()).toBe(true);
    expect(collapsed.find('.list-item').exists()).toBe(false);

    const expanded = mountList({
      isExpanded: true,
      hasItems: true,
      showDivider: true,
    });
    expect(expanded.find('.list-item').exists()).toBe(true);
  });

  it('emits toggleExpanded when the divider is clicked', async () => {
    const wrapper = mountList({
      isExpanded: false,
      hasItems: true,
      showDivider: true,
    });
    await wrapper.find('.expandable-divider').trigger('click');
    expect(wrapper.emitted('toggleExpanded')).toBeTruthy();
  });
});
