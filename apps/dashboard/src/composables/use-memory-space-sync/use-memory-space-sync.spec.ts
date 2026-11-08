import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, KeepAlive, nextTick, ref } from 'vue';

import { fetchConfig, saveConfig } from '@/api/config.api';
import { useMemorySpacesStore } from '@/stores/memory/memory-spaces/memory-spaces.store';
import type { SessionConfig } from '@/types/session-config.model';

import { useMemorySpaceSync } from './use-memory-space-sync';

vi.mock('@/api/config.api', () => ({
  fetchConfig: vi.fn(async () => null),
  saveConfig: vi.fn(async () => {}),
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
    localStorage.clear();
    showProbe.value = true;
    vi.mocked(fetchConfig).mockReset().mockResolvedValue(null);
    vi.mocked(saveConfig).mockReset().mockResolvedValue(undefined);
  });

  it('syncs on mount and cancels on unmount without KeepAlive', async () => {
    const wrapper = mount(SyncProbe);
    expect(fetchConfig).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1));

    wrapper.unmount();
    expect(fetchConfig).toHaveBeenCalledTimes(1);
  });

  it('fires once per open/close cycle inside KeepAlive', async () => {
    const wrapper = mount(KeepAliveHost);
    expect(fetchConfig).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1));

    showProbe.value = false;
    await nextTick();
    showProbe.value = true;
    await nextTick();
    expect(fetchConfig).toHaveBeenCalledTimes(2);

    showProbe.value = false;
    await nextTick();
    wrapper.unmount();
  });

  it('adopts server values for both ids and records the cognition space', async () => {
    vi.mocked(fetchConfig).mockResolvedValue({
      sessionId: 's1',
      memoryPartition: 'server-partition',
      memoryCognition: 'server-cognition',
    });
    const wrapper = mount(SyncProbe);

    await vi.waitFor(() => {
      expect(useMemorySpacesStore().memoryCognition).toBe('server-cognition');
    });
    expect(useMemorySpacesStore().memoryPartition).toBe('server-partition');
    expect(useMemorySpacesStore().memoryCognitionSpaces).toContain(
      'server-cognition',
    );
    expect(saveConfig).not.toHaveBeenCalled();
    wrapper.unmount();
  });

  it('pushes local defaults back when the server has none', async () => {
    const store = useMemorySpacesStore();
    store.memoryPartition = 'local-partition';
    store.memoryCognition = 'local-cognition';
    const wrapper = mount(SyncProbe);

    await vi.waitFor(() => {
      expect(saveConfig).toHaveBeenCalledWith(expect.any(String), {
        memoryPartition: 'local-partition',
        memoryCognition: 'local-cognition',
      });
    });
    wrapper.unmount();
  });

  it('adopts what the server has and pushes back only the missing id', async () => {
    vi.mocked(fetchConfig).mockResolvedValue({
      sessionId: 's1',
      memoryPartition: 'server-partition',
    });
    useMemorySpacesStore().memoryCognition = 'local-cognition';
    const wrapper = mount(SyncProbe);

    await vi.waitFor(() => {
      expect(saveConfig).toHaveBeenCalledWith(expect.any(String), {
        memoryCognition: 'local-cognition',
      });
    });
    expect(useMemorySpacesStore().memoryPartition).toBe('server-partition');
    expect(saveConfig).not.toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ memoryPartition: expect.anything() }),
    );
    wrapper.unmount();
  });

  it('dedupes concurrent mounted surfaces into one fetch', async () => {
    let resolveFetch: (value: SessionConfig | null) => void = () => {};
    vi.mocked(fetchConfig).mockImplementation(
      () =>
        new Promise<SessionConfig | null>((resolve) => {
          resolveFetch = resolve;
        }),
    );
    const first = mount(SyncProbe);
    const second = mount(SyncProbe);
    expect(fetchConfig).toHaveBeenCalledTimes(1);

    resolveFetch(null);
    await vi.waitFor(() => expect(saveConfig).toHaveBeenCalledTimes(1));
    first.unmount();
    second.unmount();
  });

  it('keeps local values when sync is cancelled mid-flight', async () => {
    vi.mocked(fetchConfig).mockImplementation(
      (sessionId, signal) =>
        new Promise<SessionConfig | null>((_resolve, reject) => {
          signal?.addEventListener('abort', () =>
            reject(new Error(`aborted ${sessionId}`)),
          );
        }),
    );
    const store = useMemorySpacesStore();
    store.memoryPartition = 'local-partition';
    const wrapper = mount(SyncProbe);
    wrapper.unmount();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(store.memoryPartition).toBe('local-partition');
    expect(saveConfig).not.toHaveBeenCalled();
  });

  it('restarts after a cancelled sync instead of reusing the aborted fetch', async () => {
    vi.mocked(fetchConfig)
      .mockImplementationOnce(
        (_sessionId, signal) =>
          new Promise<SessionConfig | null>((_resolve, reject) => {
            signal?.addEventListener('abort', () =>
              reject(new Error('aborted')),
            );
          }),
      )
      .mockResolvedValue({
        sessionId: 's1',
        memoryPartition: 'server-partition',
      });

    const first = mount(SyncProbe);
    first.unmount();
    const second = mount(SyncProbe);
    expect(fetchConfig).toHaveBeenCalledTimes(2);

    await vi.waitFor(() => {
      expect(useMemorySpacesStore().memoryPartition).toBe('server-partition');
    });
    second.unmount();
  });
});
