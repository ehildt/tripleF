import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import CollapsiblePanel from './CollapsiblePanel.vue';

function mountPanel(props: Record<string, unknown> = {}) {
  return mount(CollapsiblePanel, {
    props: { title: 'Section', ...props },
    slots: { default: '<p class="body-content">body</p>' },
  });
}

describe('CollapsiblePanel', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts expanded by default and toggles on click', async () => {
    const wrapper = mountPanel();

    const toggle = wrapper.find('.collapsible-panel__toggle');
    expect(toggle.attributes('aria-expanded')).toBe('true');
    expect(wrapper.find('.body-content').exists()).toBe(true);

    await toggle.trigger('click');
    expect(toggle.attributes('aria-expanded')).toBe('false');
  });

  it('starts collapsed with defaultExpanded false', () => {
    const wrapper = mountPanel({ defaultExpanded: false });
    expect(
      wrapper.find('.collapsible-panel__toggle').attributes('aria-expanded'),
    ).toBe('false');
  });

  it('persists the toggle state per panel id and restores it', async () => {
    const wrapper = mountPanel({ id: 'panel-a' });

    await wrapper.find('.collapsible-panel__toggle').trigger('click');
    await wrapper.vm.$nextTick();
    await wrapper.vm.$nextTick(); // watcher flush

    expect(localStorage.getItem('settings.collapsible.panel-a')).toBe('0');

    const remounted = mountPanel({ id: 'panel-a' });
    expect(
      remounted.find('.collapsible-panel__toggle').attributes('aria-expanded'),
    ).toBe('false');
  });
});
