import { afterEach, describe, expect, it, vi } from 'vitest';

import { MemoryHttpTransportService } from './memory-http-transport.service.js';

const config = (overrides: { enabled?: boolean } = {}) => ({
  url: 'http://memory:3400',
  enabled: true,
  ...overrides,
});

const okResponse = (body: unknown) => ({
  ok: true,
  json: async () => body,
});

describe('MemoryHttpTransportService', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('exposes the feature flag', () => {
    expect(new MemoryHttpTransportService(config()).enabled).toBe(true);
    expect(
      new MemoryHttpTransportService(config({ enabled: false })).enabled,
    ).toBe(false);
  });

  it('prefixes the versioned app path onto the configured url', () => {
    expect(new MemoryHttpTransportService(config()).baseUrl).toBe(
      'http://memory:3400/api/v1',
    );
  });

  it('returns the parsed body on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse({ a: 1 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new MemoryHttpTransportService(config()).request('http://memory/x'),
    ).resolves.toEqual({ a: 1 });
    expect(fetchMock).toHaveBeenCalledWith('http://memory/x', undefined);
  });

  it('forwards the request init', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse([]));
    vi.stubGlobal('fetch', fetchMock);
    const init = { method: 'POST' };

    await new MemoryHttpTransportService(config()).request(
      'http://memory/x',
      init,
    );

    expect(fetchMock).toHaveBeenCalledWith('http://memory/x', init);
  });

  it('throws with the status and url on a non-2xx response', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }),
    );

    await expect(
      new MemoryHttpTransportService(config()).request('http://memory/x'),
    ).rejects.toThrow('Memory service error 503 for http://memory/x');
  });
});
