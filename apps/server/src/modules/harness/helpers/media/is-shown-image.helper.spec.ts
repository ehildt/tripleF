import { describe, expect, it } from 'vitest';

import type { ShownMediaKeys } from '../../services/shown-media.service.types.js';

import { isShownImage } from './is-shown-image.helper.js';

const keys = (images: string[] = []): ShownMediaKeys => ({
  images: new Set(images),
  videos: new Set<string>(),
});

/**
 * The registry stores two key shapes for images — `fp:<fingerprint>` for
 * content identity and `sh:<storage hash>` for references to objects
 * ingested in earlier turns. A miss here reships media the user already saw;
 * a false hit drops a genuinely new image.
 */
describe('isShownImage', () => {
  it('matches a candidate by content fingerprint', () => {
    expect(isShownImage(keys(['fp:abc']), { fingerprint: 'abc' })).toBe(true);
    expect(isShownImage(keys(['fp:abc']), { fingerprint: 'other' })).toBe(
      false,
    );
  });

  it('matches a candidate by storage hash', () => {
    const storageUrl = '/api/v1/storage/sess/conv/hash-1';

    expect(isShownImage(keys(['sh:hash-1']), { storageUrl })).toBe(true);
    expect(isShownImage(keys(['sh:other']), { storageUrl })).toBe(false);
  });

  it('does not accept a fingerprint against a storage-hash entry', () => {
    expect(isShownImage(keys(['sh:hash-1']), { fingerprint: 'hash-1' })).toBe(
      false,
    );
  });

  it('returns false when the candidate carries no identity', () => {
    expect(isShownImage(keys(['fp:abc']), {})).toBe(false);
  });

  it('prefers the fingerprint when both identities are present', () => {
    const storageUrl = '/api/v1/storage/sess/conv/hash-1';

    expect(
      isShownImage(keys(['fp:abc']), { fingerprint: 'abc', storageUrl }),
    ).toBe(true);
    expect(
      isShownImage(keys(['sh:hash-1']), { fingerprint: 'unknown', storageUrl }),
    ).toBe(true);
  });
});
