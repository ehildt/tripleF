import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, nextTick } from 'vue';

import { useAppStore } from '../../../../stores/app';
import { useMenuTabs } from './use-menu-tabs';

function mountComposable(props: Parameters<typeof useMenuTabs>[0]) {
  const pinia = createPinia();
  setActivePinia(pinia);

  const TestComponent = defineComponent({
    setup() {
      return useMenuTabs(props);
    },
    template: '<div />',
  });

  const wrapper = mount(TestComponent, {
    global: { plugins: [pinia] },
  });

  return wrapper.vm;
}

describe('useMenuTabs', () => {
  afterEach(() => {
    localStorage.removeItem('harness-show-counters');
    localStorage.removeItem('harness-tab-visibility');
  });

  it('returns tabs for all visible tabs', () => {
    const vm = mountComposable({
      activeTab: 'http',
      debugCount: 0,
    });

    expect(vm.tabs.map((t) => t.tab)).toEqual([
      'http',
      'dlq',
      'debug',
      'sysctl',
    ]);
  });

  it('uses configured tint values', () => {
    const vm = mountComposable({
      activeTab: 'http',
      debugCount: 0,
    });

    expect(vm.tabs.find((t) => t.tab === 'dlq')?.tint).toBe(0.55);
  });

  it('includes counts when counters are enabled', () => {
    localStorage.setItem('harness-show-counters', 'true');
    const vm = mountComposable({
      activeTab: 'http',
      debugCount: 7,
      dlqCount: 3,
    });

    expect(vm.tabs.find((t) => t.tab === 'debug')?.count).toBe(7);
    expect(vm.tabs.find((t) => t.tab === 'dlq')?.count).toBe(3);
  });

  it('omits counts when counters are disabled', () => {
    localStorage.setItem('harness-show-counters', 'false');
    const vm = mountComposable({
      activeTab: 'http',
      debugCount: 7,
      dlqCount: 3,
    });

    expect(vm.tabs.find((t) => t.tab === 'debug')?.count).toBeUndefined();
    expect(vm.tabs.find((t) => t.tab === 'dlq')?.count).toBeUndefined();
  });

  it('hides tabs that the user has toggled off', async () => {
    const pinia = createPinia();
    setActivePinia(pinia);

    const appStore = useAppStore();
    appStore.toggleTabVisibility('sysctl');

    const TestComponent = defineComponent({
      setup() {
        return useMenuTabs({ activeTab: 'http', debugCount: 0 });
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent, {
      global: { plugins: [pinia] },
    });

    await nextTick();

    expect(wrapper.vm.tabs.map((t: { tab: string }) => t.tab)).not.toContain(
      'sysctl',
    );
  });
});
