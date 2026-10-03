import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue';

import { useMemorySpaceSync } from './use-memory-space-sync';

const { syncMemorySpacesFromServer, cancelMemorySpaceSync } = vi.hoisted(
  () => ({
    syncMemorySpacesFromServer: vi.fn(),
    cancelMemorySpaceSync: vi.fn(),
  }),
);

vi.mock('@/stores/app', () => ({
  useAppStore: () => ({
    syncMemorySpacesFromServer,
    cancelMemorySpaceSync,
  }),
}));

/** Minimal consumer of the composable under test. */
const SyncProbe = defineComponent({
  setup() {
    useMemorySpaceSync();
    return () => h('div', { class: 'sync-probe' });
  },
});

/** Toggleable KeepAlive host — exercises the activated/deactivated path. */
const showProbe = ref(true);

const KeepAliveHost = defineComponent({
  setup() {
    return () =>
      h(KeepAlive, null, {
        default: () => (showProbe.value ? h(SyncProbe) : null),
      });
  },
});

describe('useMemorySpaceSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    showProbe.value = true;
    syncMemorySpacesFromServer.mockClear();
    cancelMemorySpaceSync.mockClear();
  });

  it('syncs on mount and cancels on unmount without KeepAlive', () => {
    const wrapper = mount(SyncProbe);
    expect(syncMemorySpacesFromServer).toHaveBeenCalledTimes(1);

    wrapper.unmount();
    expect(cancelMemorySpaceSync).toHaveBeenCalledTimes(1);
  });

  it('fires once per open/close cycle inside KeepAlive', async () => {
    const wrapper = mount(KeepAliveHost);
    // First mount fires both onMounted and onActivated — the guard collapses
    // them into one sync.
    expect(syncMemorySpacesFromServer).toHaveBeenCalledTimes(1);

    showProbe.value = false;
    await nextTick();
    expect(cancelMemorySpaceSync).toHaveBeenCalledTimes(1);

    showProbe.value = true;
    await nextTick();
    expect(syncMemorySpacesFromServer).toHaveBeenCalledTimes(2);

    wrapper.unmount();
    expect(cancelMemorySpaceSync).toHaveBeenCalledTimes(2);
  });
});
