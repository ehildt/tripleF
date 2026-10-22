import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchOriginalText } from './fetch-original-text.helper';

describe('fetchOriginalText', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('decodes the response body as text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () =>
          Promise.resolve(
            new TextEncoder().encode('héllo').buffer as ArrayBuffer,
          ),
      }),
    );
    await expect(fetchOriginalText('/url')).resolves.toEqual({ text: 'héllo' });
  });

  it('throws on a failed fetch', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 404 }),
    );
    await expect(fetchOriginalText('/url')).rejects.toThrow('HTTP 404');
  });
});
