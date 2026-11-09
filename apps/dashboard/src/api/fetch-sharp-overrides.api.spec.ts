import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchSharpOverrides } from './fetch-sharp-overrides.api';

describe('fetchSharpOverrides', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('loads the sharp override endpoint and returns its unknown payload', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ enabled: false }), { status: 200 }),
    );

    await expect(fetchSharpOverrides()).resolves.toEqual({ enabled: false });
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sharp-overrides');
  });

  it('rejects a non-success response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 503 }));

    await expect(fetchSharpOverrides()).rejects.toThrow(
      'Failed to load preprocessing settings: 503',
    );
  });
});
