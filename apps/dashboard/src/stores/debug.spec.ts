import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebugStore } from './debug';

vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(100) });

describe('useDebugStore', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    // Logging is off (paused) by default; unpause so the add/track tests
    // exercise the real append behavior.
    useDebugStore().debugPaused = false;
    vi.restoreAllMocks();
  });

  it('initializes empty', () => {
    const store = useDebugStore();
    expect(store.debugResults).toEqual([]);
    expect(store.debugLogCount).toBe(0);
    expect(store.selectedDebugResult).toBeNull();
    expect(store.lastSeenDebugCount).toBe(0);
  });

  it('starts paused (logging off) by default', () => {
    localStorage.clear();
    setActivePinia(createPinia());
    const store = useDebugStore();
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

  it('addDebugResult prepends result with generated id and timestamp', () => {
    const store = useDebugStore();
    store.addDebugResult({
      endpoint: '/api',
      method: 'POST',
      status: 'success',
      responseTime: 10,
      type: 'http',
    });
    expect(store.debugResults).toHaveLength(1);
    expect(store.debugResults[0].endpoint).toBe('/api');
    expect(store.debugResults[0].id).toBeDefined();
    expect(store.debugResults[0].timestamp).toBeDefined();
    expect(store.debugResults[0].direction).toBe('request');
  });

  it('addSocketDebugEntry prepends result', () => {
    const store = useDebugStore();
    store.addSocketDebugEntry({
      endpoint: 'ws',
      method: 'LISTEN',
      status: 'success',
      responseTime: 0,
      type: 'socket',
      direction: 'request',
    });
    expect(store.debugResults).toHaveLength(1);
    expect(store.debugResults[0].type).toBe('socket');
  });

  it('clearDebugResults removes all and resets selected', () => {
    const store = useDebugStore();
    store.addDebugResult({
      endpoint: '/x',
      method: 'GET',
      status: 'error',
      responseTime: 1,
      type: 'http',
      errorMessage: 'fail',
    });
    store.selectedDebugResult = store.debugResults[0];
    store.clearDebugResults();
    expect(store.debugResults).toHaveLength(0);
    expect(store.selectedDebugResult).toBeNull();
    expect(store.lastSeenDebugCount).toBe(0);
  });

  it('incrementDebugCount updates lastSeenDebugCount', () => {
    const store = useDebugStore();
    store.incrementDebugCount(5);
    expect(store.lastSeenDebugCount).toBe(5);
    store.incrementDebugCount(3);
    expect(store.lastSeenDebugCount).toBe(5);
    store.incrementDebugCount(10);
    expect(store.lastSeenDebugCount).toBe(10);
  });

  it('resetDebugCount sets to current count', () => {
    const store = useDebugStore();
    store.addDebugResult({
      endpoint: '/a',
      method: 'GET',
      status: 'success',
      responseTime: 1,
      type: 'http',
    });
    store.resetDebugCount();
    expect(store.lastSeenDebugCount).toBe(1);
  });

  it('trackRequest records success responses', async () => {
    vi.stubGlobal('performance', { now: vi.fn().mockReturnValue(200) });
    const store = useDebugStore();
    const promise = Promise.resolve(
      new Response('{"ok":true}', { status: 200 }),
    );
    store.trackRequest('/api', 'POST', promise);
    await new Promise((r) => setTimeout(r, 50));
    expect(store.debugResults).toHaveLength(1);
    expect(store.debugResults[0].status).toBe('success');
    expect(store.debugResults[0].statusCode).toBe(200);
  });

  it('trackRequest records error responses', async () => {
    const store = useDebugStore();
    const promise = Promise.resolve(new Response('error', { status: 500 }));
    store.trackRequest('/api', 'GET', promise);
    await new Promise((r) => setTimeout(r, 50));
    expect(store.debugResults).toHaveLength(1);
    expect(store.debugResults[0].status).toBe('error');
    expect(store.debugResults[0].statusCode).toBe(500);
  });
});
