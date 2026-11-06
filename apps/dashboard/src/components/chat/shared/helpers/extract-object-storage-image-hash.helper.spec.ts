import { describe, expect, it } from 'vitest';

import { extractObjectStorageImageHash } from './extract-object-storage-image-hash.helper';

describe('extractObjectStorageImageHash', () => {
  it('extracts the hash segment of an object-storage URL', () => {
    expect(
      extractObjectStorageImageHash(
        '/api/v1/object-storage/session-1/conv-1/abc123',
      ),
    ).toBe('abc123');
  });

  it('returns null for non-object-storage URLs', () => {
    expect(
      extractObjectStorageImageHash('https://example.com/a.jpg'),
    ).toBeNull();
    expect(extractObjectStorageImageHash('blob:http://x/y')).toBeNull();
    expect(extractObjectStorageImageHash('')).toBeNull();
  });
});
