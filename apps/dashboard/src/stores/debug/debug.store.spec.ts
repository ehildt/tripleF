import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';

import { useDebugStore } from './debug.store';

describe('useDebugStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    useDebugStore().debugPaused = false;
    vi.restoreAllMocks();
  });

  it('initializes empty and paused by default', () => {
    localStorage.clear();
    setActivePinia(createPinia());
    const store = useDebugStore();

    expect(store.debugResults).toEqual([]);
    expect(store.debugLogCount).toBe(0);
    expect(store.debugPaused).toBe(true);
    store.addDebugResult({
      endpoint: '/api',
      method: 'GET',
      status: 'success',
      responseTime: 1,
      type: 'http',
    });
    expect(store.debugResults).toHaveLength(0);
  });

  it('resumes only from an explicitly false stored pause value', () => {
    localStorage.setItem('debug-paused', 'unexpected');
    setActivePinia(createPinia());
    expect(useDebugStore().debugPaused).toBe(true);

    localStorage.setItem('debug-paused', 'false');
    setActivePinia(createPinia());
    expect(useDebugStore().debugPaused).toBe(false);
  });

  it('stays paused and nonfatal when storage cannot be read', () => {
    vi.spyOn(localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage denied');
    });
    setActivePinia(createPinia());

    expect(useDebugStore().debugPaused).toBe(true);
  });

  it('prepends typed HTTP and socket entries with generated metadata', () => {
    const store = useDebugStore();
    store.addDebugResult({
      endpoint: '/api',
      method: 'POST',
      status: 'success',
      responseTime: 10,
      type: 'http',
    });
    store.addDebugResult({
      endpoint: 'ws',
      method: 'LISTEN',
      status: 'success',
      responseTime: 0,
      type: 'socket',
      direction: 'response',
    });

    expect(store.debugResults).toHaveLength(2);
    expect(store.debugResults[0]).toMatchObject({
      type: 'socket',
      direction: 'response',
    });
    expect(store.debugResults[1]).toMatchObject({
      endpoint: '/api',
      direction: 'request',
    });
    expect(store.debugResults[1].id).toBeTruthy();
    expect(store.debugResults[1].epoch).toBeTypeOf('number');
  });

  it('persists pause changes', async () => {
    const store = useDebugStore();
    store.debugPaused = false;
    await nextTick();
    expect(localStorage.getItem('debug-paused')).toBe('false');

    store.toggleDebugPaused();
    await nextTick();
    expect(localStorage.getItem('debug-paused')).toBe('true');
  });

  it('counts unread live entries and preserves read ids when cleared', () => {
    const store = useDebugStore();
    store.addDebugResult({
      endpoint: '/first',
      method: 'GET',
      status: 'success',
      responseTime: 1,
      type: 'http',
    });
    const firstId = store.debugResults[0].id;

    expect(store.debugLogCount).toBe(1);
    store.markDebugAsRead(firstId);
    expect(store.isDebugRead(firstId)).toBe(true);
    expect(store.debugLogCount).toBe(0);

    store.addDebugResult({
      endpoint: '/second',
      method: 'GET',
      status: 'success',
      responseTime: 1,
      type: 'http',
    });
    expect(store.debugLogCount).toBe(1);

    store.clearDebugResults();
    expect(store.debugResults).toHaveLength(0);
    expect(store.debugLogCount).toBe(0);
    expect(store.isDebugRead(firstId)).toBe(true);
  });
});
