import { describe, expect, it } from 'vitest';

import { extractStorageImageHash } from './extract-storage-image-hash.helper';

describe('extractStorageImageHash', () => {
  it('extracts the hash from a storage image url', () => {
    expect(
      extractStorageImageHash(
        '/api/v1/storage/session-1/conversation-1/abc123',
      ),
    ).toBe('abc123');
  });

  it('ignores query strings and fragments after the hash', () => {
    expect(
      extractStorageImageHash('/api/v1/storage/s/c/abc123?width=400#top'),
    ).toBe('abc123');
  });

  it('returns null for external urls', () => {
    expect(
      extractStorageImageHash('https://cdn.example.com/img.png'),
    ).toBeNull();
  });

  it('returns null for blob object urls', () => {
    expect(
      extractStorageImageHash('blob:http://localhost:5173/uuid-1'),
    ).toBeNull();
  });

  it('returns null for a storage path without the hash segment', () => {
    expect(extractStorageImageHash('/api/v1/storage/session-1')).toBeNull();
  });
});
