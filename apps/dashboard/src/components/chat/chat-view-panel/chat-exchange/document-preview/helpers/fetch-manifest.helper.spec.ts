import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchManifest } from './fetch-manifest.helper';

describe('fetchManifest', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns sanitized html from the conversion manifest', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ html: '<p>ok</p><script>alert(1)</script>' }),
      }),
    );
    const result = await fetchManifest('/api/v1/storage/s/c/doc.docx');
    expect(result?.html).toBe('<p>ok</p>');
    expect(result?.html).not.toContain('<script>');
  });

  it('joins slide decks as text', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ slides: ['one', 'two'] }),
      }),
    );
    expect(await fetchManifest('/url')).toEqual({ text: 'one\n\ntwo' });
  });

  it('returns plain text manifests as-is', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'plain' }),
      }),
    );
    expect(await fetchManifest('/url')).toEqual({ text: 'plain' });
  });

  it('returns null on a failed fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    expect(await fetchManifest('/url')).toBeNull();
  });

  it('returns null when the request throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('net')));
    expect(await fetchManifest('/url')).toBeNull();
  });
});
