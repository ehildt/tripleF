import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useDebugStore } from '@/stores/debug/debug.store';

import { useDebugRequestTracker } from './use-debug-request-tracker';

async function flushTracking(): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
}

describe('useDebugRequestTracker', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
    useDebugStore().debugPaused = false;
    vi.restoreAllMocks();
    vi.stubGlobal('performance', { now: vi.fn(() => 100) });
  });

  it('returns the original promise and preserves a readable caller body', async () => {
    const response = new Response('{"ok":true}', { status: 200 });
    const promise = Promise.resolve(response);

    const returned = useDebugRequestTracker().trackRequest(
      '/api',
      'POST',
      promise,
      { requestId: 'request-1', model: 'llama' },
    );

    expect(returned).toBe(promise);
    expect(await (await returned).text()).toBe('{"ok":true}');
    await flushTracking();
    expect(useDebugStore().debugResults).toHaveLength(1);
    expect(useDebugStore().debugResults[0]).toMatchObject({
      endpoint: '/api',
      method: 'POST',
      status: 'success',
      statusCode: 200,
      responseBody: '{\n  "ok": true\n}',
      requestId: 'request-1',
      model: 'llama',
    });
  });

  it('records HTTP errors with status and formatted response body', async () => {
    const promise = Promise.resolve(
      new Response('{"error":"failed"}', { status: 500 }),
    );

    useDebugRequestTracker().trackRequest('/api', 'GET', promise);
    await promise;
    await flushTracking();

    expect(useDebugStore().debugResults[0]).toMatchObject({
      status: 'error',
      statusCode: 500,
      errorMessage: 'HTTP 500: {\n  "error": "failed"\n}',
      responseBody: '{\n  "error": "failed"\n}',
    });
  });

  it('records a rejected request without wrapping its rejection', async () => {
    const promise = Promise.reject(new Error('network down'));

    const returned = useDebugRequestTracker().trackRequest(
      '/api',
      'GET',
      promise,
    );

    await expect(returned).rejects.toThrow('network down');
    await flushTracking();
    expect(useDebugStore().debugResults).toHaveLength(1);
    expect(useDebugStore().debugResults[0]).toMatchObject({
      status: 'error',
      errorMessage: 'network down',
    });
  });

  it('skips cloning and appending when paused before the response arrives', async () => {
    let resolveResponse!: (response: Response) => void;
    const promise = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const response = new Response('body');
    const clone = vi.spyOn(response, 'clone');
    useDebugRequestTracker().trackRequest('/api', 'GET', promise);

    useDebugStore().debugPaused = true;
    resolveResponse(response);
    await promise;
    await flushTracking();

    expect(clone).not.toHaveBeenCalled();
    expect(useDebugStore().debugResults).toHaveLength(0);
  });

  it('contains clone failures without creating a network-error entry', async () => {
    const response = new Response('body');
    vi.spyOn(response, 'clone').mockImplementation(() => {
      throw new Error('body already consumed');
    });
    const diagnostic = vi.spyOn(console, 'error').mockImplementation(() => {});
    const promise = Promise.resolve(response);

    const returned = useDebugRequestTracker().trackRequest(
      '/api',
      'GET',
      promise,
    );

    expect(await (await returned).text()).toBe('body');
    await flushTracking();
    expect(useDebugStore().debugResults).toHaveLength(0);
    expect(diagnostic).toHaveBeenCalledWith(
      'Debug request tracking failed',
      expect.any(Error),
    );
  });
});
