import { describe, expect, it } from 'vitest';

import { extractStorageHash } from './extract-storage-hash.helper.js';

describe('extractStorageHash', () => {
  it('extracts the hash from a storage url', () => {
    expect(extractStorageHash('/api/v1/storage/sess/conv/abc123')).toBe(
      'abc123',
    );
  });

  it('strips query parameters', () => {
    expect(extractStorageHash('/api/v1/storage/sess/conv/abc123?w=100')).toBe(
      'abc123',
    );
  });

  it('returns the last segment for a bare path', () => {
    expect(extractStorageHash('/api/v1/storage')).toBe('storage');
  });

  it('returns undefined for an empty hash', () => {
    expect(extractStorageHash('/api/v1/storage/sess/conv/')).toBe(undefined);
  });
});
