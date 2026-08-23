import { describe, expect, it, vi } from 'vitest';

vi.mock('./fetch-image-buffer.helper.js', () => ({
  fetchImageBuffer: vi.fn(),
}));
vi.mock('./build-image-fingerprint.helper.js', () => ({
  buildImageFingerprint: vi.fn(),
}));

import { buildImageFingerprint } from './build-image-fingerprint.helper.js';
import { dedupeImagesByFingerprint } from './dedupe-images-by-fingerprint.helper.js';
import { fetchImageBuffer } from './fetch-image-buffer.helper.js';

const mockFetch = vi.mocked(fetchImageBuffer);
const mockFingerprint = vi.mocked(buildImageFingerprint);

describe('dedupeImagesByFingerprint', () => {
  it('returns empty for no items', async () => {
    await expect(dedupeImagesByFingerprint([])).resolves.toEqual({
      items: [],
      removedCount: 0,
    });
  });

  it('dedupes images with the same fingerprint', async () => {
    mockFetch.mockResolvedValue(Buffer.from('data'));
    mockFingerprint.mockResolvedValue('fp-1');
    const result = await dedupeImagesByFingerprint([
      { imageUrl: 'https://a.com/1.jpg' },
      { imageUrl: 'https://b.com/2.jpg' },
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.removedCount).toBe(1);
  });

  it('keeps images with distinct fingerprints', async () => {
    mockFetch.mockResolvedValue(Buffer.from('data'));
    mockFingerprint.mockResolvedValueOnce('fp-1').mockResolvedValueOnce('fp-2');
    const result = await dedupeImagesByFingerprint([
      { imageUrl: 'https://a.com/1.jpg' },
      { imageUrl: 'https://b.com/2.jpg' },
    ]);
    expect(result.items).toHaveLength(2);
    expect(result.removedCount).toBe(0);
  });

  it('keeps images whose fingerprint cannot be computed', async () => {
    mockFetch.mockResolvedValue(undefined);
    const result = await dedupeImagesByFingerprint([
      { imageUrl: 'https://a.com/1.jpg' },
    ]);
    expect(result.items).toHaveLength(1);
    expect(result.removedCount).toBe(0);
  });
});
