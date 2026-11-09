import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { previewSharpOverrides } from './preview-sharp-overrides.api';

describe('previewSharpOverrides', () => {
  const fetchMock =
    vi.fn<
      (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
    >();
  const file = new File(['image'], 'image.png', { type: 'image/png' });

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('posts the selected image in the existing multipart field', async () => {
    const payload = [{ variant: 'original' }];
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );

    await expect(previewSharpOverrides(file)).resolves.toEqual(payload);

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/sharp-overrides/preview');
    expect(options?.method).toBe('POST');
    const body = options?.body;
    expect(body).toBeInstanceOf(FormData);
    if (!(body instanceof FormData)) throw new Error('Expected multipart body');
    expect(body.get('images')).toBe(file);
  });

  it('preserves the response status and body in preview failures', async () => {
    fetchMock.mockResolvedValue(new Response('invalid image', { status: 422 }));

    await expect(previewSharpOverrides(file)).rejects.toThrow(
      '422: invalid image',
    );
  });
});
