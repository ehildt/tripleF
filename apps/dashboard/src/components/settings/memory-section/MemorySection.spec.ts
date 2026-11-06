import { flushPromises, mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { MemoryOverridesConfig } from '@/api/memory-overrides.api';
import {
  fetchMemoryOverrides,
  updateMemoryOverrides,
} from '@/api/memory-overrides.api';

import MemorySection from './MemorySection.vue';

// The overrides read fires on mount; resolve it with an empty effective
// config so the fields render their client-side fallbacks.
vi.mock('@/api/memory-overrides.api', () => ({
  fetchMemoryOverrides: vi.fn(async () => ({}) as MemoryOverridesConfig),
  updateMemoryOverrides: vi.fn(async () => ({}) as MemoryOverridesConfig),
}));

// The memory-space sync fires on mount; stub the config fetch so it never
// hits the network in tests.
vi.mock('@/api/config.api', () => ({
  fetchConfig: vi.fn(async () => null),
  saveConfig: vi.fn(async () => {}),
}));

describe('MemorySection', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.mocked(fetchMemoryOverrides).mockResolvedValue(
      {} as MemoryOverridesConfig,
    );
    vi.mocked(updateMemoryOverrides).mockResolvedValue(
      {} as MemoryOverridesConfig,
    );
  });

  it('renders one submenu tab per configuration group', () => {
    const wrapper = mount(MemorySection);
    const tabs = wrapper.findAll('.menu-button');
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
      .findAll('.menu-button')
      .find((tab) => tab.attributes('aria-label') === 'Maintenance models');
    await maintenanceTab?.trigger('click');

    expect(wrapper.text()).toContain('Consolidate model');
    expect(wrapper.text()).not.toContain('Memory partition');
  });

  it('shows the auto-triggers group when its tab is clicked', async () => {
    const wrapper = mount(MemorySection);
    const autoTriggersTab = wrapper
      .findAll('.menu-button')
      .find((tab) => tab.attributes('aria-label') === 'Auto-triggers');
    await autoTriggersTab?.trigger('click');

    expect(wrapper.text()).toContain('Partition reflect auto');
    expect(wrapper.text()).toContain('Cluster auto');
    expect(wrapper.text()).not.toContain('Memory partition');
  });

  it('loads overrides once while switching through every group', async () => {
    const wrapper = mount(MemorySection);
    await flushPromises();
    const tabs = wrapper.findAll('.menu-button');

    for (const tab of tabs) await tab.trigger('click');

    expect(tabs).toHaveLength(8);
    expect(fetchMemoryOverrides).toHaveBeenCalledTimes(1);
  });

  it('saves an edited cognition limit through the shared overrides state', async () => {
    vi.mocked(fetchMemoryOverrides).mockResolvedValue({
      cognitionLimit: 5000,
    } as MemoryOverridesConfig);
    const wrapper = mount(MemorySection);
    await flushPromises();
    const cognitionTab = wrapper
      .findAll('.menu-button')
      .find((tab) => tab.attributes('aria-label') === 'Cognition profile');
    await cognitionTab?.trigger('click');

    await wrapper.get('input[type="number"]').setValue('6000');
    await flushPromises();

    expect(updateMemoryOverrides).toHaveBeenCalledWith({
      cognitionLimit: 6000,
    });
    expect(fetchMemoryOverrides).toHaveBeenCalledTimes(1);
  });
});
