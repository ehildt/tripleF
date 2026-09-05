import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MemoryOverridesConfig } from '@/api/memory-overrides.api';

import MemorySection from './MemorySection.vue';

// The overrides read fires on mount; resolve it with an empty effective
// config so the fields render their client-side fallbacks.
vi.mock('@/api/memory-overrides.api', () => ({
  fetchMemoryOverrides: vi.fn(async () => ({}) as MemoryOverridesConfig),
  updateMemoryOverrides: vi.fn(async () => ({}) as MemoryOverridesConfig),
}));

describe('MemorySection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('renders one submenu tab per configuration group', () => {
    const wrapper = mount(MemorySection);
    const tabs = wrapper.findAll('.settings-submenu__tab');
    expect(tabs).toHaveLength(8);
    expect(tabs.map((tab) => tab.attributes('aria-label'))).toEqual([
      'Memory spaces',
      'Short-term memory probe',
      'Cognition profile',
      'Constellation diagram',
      'Maintenance models',
      'Auto-triggers',
      'Sweep limits',
      'Gap-filling research',
    ]);
  });

  it('shows the memory spaces group by default', () => {
    const wrapper = mount(MemorySection);
    expect(wrapper.text()).toContain('Memory partition');
    expect(wrapper.text()).toContain('Memory cognition');
    expect(wrapper.text()).not.toContain('Consolidate model');
  });

  it('switches the visible group when a submenu tab is clicked', async () => {
    const wrapper = mount(MemorySection);
    const maintenanceTab = wrapper
      .findAll('.settings-submenu__tab')
      .find((tab) => tab.attributes('aria-label') === 'Maintenance models');
    await maintenanceTab?.trigger('click');

    expect(wrapper.text()).toContain('Consolidate model');
    expect(wrapper.text()).not.toContain('Memory partition');
  });

  it('shows the auto-triggers group when its tab is clicked', async () => {
    const wrapper = mount(MemorySection);
    const autoTriggersTab = wrapper
      .findAll('.settings-submenu__tab')
      .find((tab) => tab.attributes('aria-label') === 'Auto-triggers');
    await autoTriggersTab?.trigger('click');

    expect(wrapper.text()).toContain('Partition reflect auto');
    expect(wrapper.text()).toContain('Cluster auto');
    expect(wrapper.text()).not.toContain('Memory partition');
  });
});
