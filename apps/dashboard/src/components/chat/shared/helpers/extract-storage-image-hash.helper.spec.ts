import { describe, expect, it } from 'vitest';

import { extractStorageImageHash } from './extract-storage-image-hash.helper';

describe('extractStorageImageHash', () => {
  it('extracts the hash segment of a storage URL', () => {
    expect(
      extractStorageImageHash('/api/v1/storage/session-1/conv-1/abc123'),
    ).toBe('abc123');
  });

  it('returns null for non-storage URLs', () => {
    expect(extractStorageImageHash('https://example.com/a.jpg')).toBeNull();
    expect(extractStorageImageHash('blob:http://x/y')).toBeNull();
    expect(extractStorageImageHash('')).toBeNull();
  });
});
