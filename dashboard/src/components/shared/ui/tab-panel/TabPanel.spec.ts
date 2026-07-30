import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import TabPanel, { type TabPanelTab } from './TabPanel.vue';

const tabs: TabPanelTab[] = [
  { id: 'one', label: 'One' },
  { id: 'two', label: 'Two' },
];

describe('TabPanel', () => {
  it('renders tab labels', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one' },
      slots: { default: 'content' },
    });
    expect(wrapper.text()).toContain('One');
    expect(wrapper.text()).toContain('Two');
  });

  it('marks the active tab', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'two' },
    });
    const active = wrapper.find('.tab-panel__tab--active');
    expect(active.exists()).toBe(true);
    expect(active.text()).toBe('Two');
  });

  it('emits select when a tab is clicked', async () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one' },
    });
    const second = wrapper.findAll('.tab-panel__tab')[1];
    await second.trigger('click');
    expect(wrapper.emitted('select')).toEqual([['two']]);
  });

  it('does not emit select when the active tab is clicked', async () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one' },
    });
    await wrapper.findAll('.tab-panel__tab')[0].trigger('click');
    expect(wrapper.emitted('select')).toBeUndefined();
  });

  it('renders the panel slot when activeTab is set', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one' },
      slots: { default: 'slot content' },
    });
    expect(wrapper.text()).toContain('slot content');
    expect(wrapper.find('.tab-panel__panel').exists()).toBe(true);
  });

  it('shows a no selection hint when activeTab is null', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: null },
    });
    expect(wrapper.text()).toContain('Select a tab to view content');
  });

  it('renders a copy button when copyable', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one', copyable: true },
    });
    expect(wrapper.find('.tab-panel__copy').exists()).toBe(true);
  });

  it('does not render a copy button when not copyable', () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one', copyable: false },
    });
    expect(wrapper.find('.tab-panel__copy').exists()).toBe(false);
  });

  it('emits copy when the copy button is clicked', async () => {
    const wrapper = mount(TabPanel, {
      props: { tabs, activeTab: 'one', copyable: true },
    });
    await wrapper.find('.tab-panel__copy').trigger('click');
    expect(wrapper.emitted('copy')).toEqual([[]]);
  });
});
