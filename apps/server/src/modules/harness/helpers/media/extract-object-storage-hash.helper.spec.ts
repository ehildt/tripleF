import { describe, expect, it } from 'vitest';

import { extractObjectStorageHash } from './extract-object-storage-hash.helper.js';

describe('extractObjectStorageHash', () => {
  it('extracts the hash from an object-storage URL', () => {
    expect(
      extractObjectStorageHash('/api/v1/object-storage/sess/conv/abc123'),
    ).toBe('abc123');
  });

  it('strips query parameters', () => {
    expect(
      extractObjectStorageHash('/api/v1/object-storage/sess/conv/abc123?w=100'),
    ).toBe('abc123');
  });

  it('returns the last segment for a bare path', () => {
    expect(extractObjectStorageHash('/api/v1/object-storage')).toBe(
      'object-storage',
    );
  });

  it('returns undefined for an empty hash', () => {
    expect(
      extractObjectStorageHash('/api/v1/object-storage/sess/conv/'),
    ).toBeUndefined();
  });
});
