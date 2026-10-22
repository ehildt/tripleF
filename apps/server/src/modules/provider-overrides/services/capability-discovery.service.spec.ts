import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CapabilityDiscoveryService } from './capability-discovery.service.js';

/** Minimal concrete lane: the base owns every guard, the subclass only fetches. */
class TestDiscoveryService extends CapabilityDiscoveryService<{
  value: number;
}> {
  readonly fetchMock = vi.fn<(key: string) => Promise<{ value: number }>>();

  protected fetchCapabilities(key: string): Promise<{ value: number }> {
    return this.fetchMock(key);
  }
}

const TTL_MS = 6 * 60 * 60 * 1000;
const START = new Date('2026-01-01T00:00:00.000Z');

/** Let the fire-and-forget refresh chain settle. */
const flushRefresh = (): Promise<void> =>
  vi.advanceTimersByTimeAsync(0).then(() => undefined);

describe('CapabilityDiscoveryService', () => {
  let service: TestDiscoveryService;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(START);
    service = new TestDiscoveryService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing without a key', async () => {
    service.refresh(undefined);

    await flushRefresh();
    expect(service.fetchMock).not.toHaveBeenCalled();
    expect(service.getCached()).toBeUndefined();
  });

  it('caches the snapshot per key within the TTL', async () => {
    service.fetchMock.mockResolvedValue({ value: 1 });
    service.refresh('key-a');
    await flushRefresh();

    vi.setSystemTime(new Date(START.getTime() + TTL_MS - 1));
    service.refresh('key-a');
    await flushRefresh();

    expect(service.fetchMock).toHaveBeenCalledTimes(1);
    expect(service.getCached()).toEqual({ value: 1 });
  });

  it('re-fetches once the snapshot is stale', async () => {
    service.fetchMock.mockResolvedValueOnce({ value: 1 });
    service.refresh('key-a');
    await flushRefresh();

    vi.setSystemTime(new Date(START.getTime() + TTL_MS + 1));
    service.fetchMock.mockResolvedValueOnce({ value: 2 });
    service.refresh('key-a');
    await flushRefresh();

    expect(service.fetchMock).toHaveBeenCalledTimes(2);
    expect(service.getCached()).toEqual({ value: 2 });
  });

  it('re-fetches immediately when the key changes', async () => {
    service.fetchMock.mockResolvedValue({ value: 1 });
    service.refresh('key-a');
    await flushRefresh();
    service.refresh('key-b');
    await flushRefresh();

    expect(service.fetchMock).toHaveBeenCalledTimes(2);
  });

  it('single-flights concurrent refreshes for the same key', async () => {
    let resolveFetch!: (value: { value: number }) => void;
    service.fetchMock.mockReturnValue(
      new Promise<{ value: number }>((resolve) => {
        resolveFetch = resolve;
      }),
    );

    service.refresh('key-a');
    service.refresh('key-a');
    resolveFetch({ value: 1 });
    await flushRefresh();

    expect(service.fetchMock).toHaveBeenCalledTimes(1);
    expect(service.getCached()).toEqual({ value: 1 });
  });

  it('swallows failures and keeps the stale snapshot', async () => {
    service.fetchMock.mockResolvedValueOnce({ value: 1 });
    service.refresh('key-a');
    await flushRefresh();

    service.fetchMock.mockRejectedValueOnce(new Error('probe down'));
    service.refresh('key-b');

    await flushRefresh();
    expect(service.getCached()).toEqual({ value: 1 });
  });
});
