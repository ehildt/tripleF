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

  /** Opt the hidden-by-default dlq/debug tabs back in. */
  function enableDlqDebug() {
    localStorage.setItem(
      'harness-tab-visibility',
      JSON.stringify({ dlq: true, debug: true }),
    );
  }

  it('hides debug by default and shows dlq', () => {
    const vm = mountComposable({
      activeTab: 'chat',
      debugCount: 0,
    });

    expect(vm.tabs.map((t) => t.tab)).toEqual([
      'chat',
      'memory',
      'dlq',
      'settings',
    ]);
  });

  it('returns all tabs when dlq/debug are enabled', () => {
    enableDlqDebug();
    const vm = mountComposable({
      activeTab: 'chat',
      debugCount: 0,
    });

    expect(vm.tabs.map((t) => t.tab)).toEqual([
      'chat',
      'memory',
      'dlq',
      'debug',
      'settings',
    ]);
  });

  it('uses configured tint values', () => {
    enableDlqDebug();
    const vm = mountComposable({
      activeTab: 'chat',
      debugCount: 0,
    });

    expect(vm.tabs.find((t) => t.tab === 'dlq')?.tint).toBeCloseTo(0.55, 2);
    expect(vm.tabs.find((t) => t.tab === 'memory')?.tint).toBeCloseTo(0.35, 2);
  });

  it('includes counts when counters are enabled', () => {
    enableDlqDebug();
    localStorage.setItem('harness-show-counters', 'true');
    const vm = mountComposable({
      activeTab: 'chat',
      debugCount: 7,
      dlqCount: 3,
    });

    expect(vm.tabs.find((t) => t.tab === 'debug')?.count).toBe(7);
    expect(vm.tabs.find((t) => t.tab === 'dlq')?.count).toBe(3);
  });

  it('omits counts when counters are disabled', () => {
    enableDlqDebug();
    localStorage.setItem('harness-show-counters', 'false');
    const vm = mountComposable({
      activeTab: 'chat',
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
    appStore.toggleTabVisibility('settings');

    const TestComponent = defineComponent({
      setup() {
        return useMenuTabs({ activeTab: 'chat', debugCount: 0 });
      },
      template: '<div />',
    });

    const wrapper = mount(TestComponent, {
      global: { plugins: [pinia] },
    });

    await nextTick();

    expect(wrapper.vm.tabs.map((t: { tab: string }) => t.tab)).not.toContain(
      'settings',
    );
  });
});
