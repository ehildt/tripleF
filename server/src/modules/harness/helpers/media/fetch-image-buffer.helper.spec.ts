import { afterEach, describe, expect, it, vi } from 'vitest';

import { fetchImageBuffer } from './fetch-image-buffer.helper.js';

const opts = { timeoutMs: 1000 };

function mockFetch(...responses: Response[]) {
  const fn = vi.fn();
  responses.forEach((r) => fn.mockResolvedValueOnce(r));
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('fetchImageBuffer', () => {
  it('returns the body for a successful fetch', async () => {
    mockFetch(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const buffer = await fetchImageBuffer('https://example.com/img.jpg', opts);
    expect(buffer).toEqual(Buffer.from([1, 2, 3]));
  });

  it('retries with a browser user agent on a 403', async () => {
    const fn = mockFetch(
      new Response(null, { status: 403 }),
      new Response(new Uint8Array([4, 5]), { status: 200 }),
    );
    const buffer = await fetchImageBuffer('https://example.com/img.jpg', opts);
    expect(buffer).toEqual(Buffer.from([4, 5]));
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns undefined for a non-ok response', async () => {
    mockFetch(new Response(null, { status: 404 }));
    const buffer = await fetchImageBuffer('https://example.com/img.jpg', opts);
    expect(buffer).toBeUndefined();
  });

  it('returns undefined for a private or localhost url', async () => {
    const fn = mockFetch(new Response(new Uint8Array([1]), { status: 200 }));
    const buffer = await fetchImageBuffer('http://localhost/img.jpg', opts);
    expect(buffer).toBeUndefined();
    expect(fn).not.toHaveBeenCalled();
  });
});
