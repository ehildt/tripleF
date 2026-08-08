import { describe, expect, it } from 'vitest';

import { extractShownMediaKeys } from './extract-shown-media-keys.helper.js';
import type { ShownMediaKeySourceOptions } from './extract-shown-media-keys.types.js';

const opts = (
  overrides: Partial<ShownMediaKeySourceOptions> = {},
): ShownMediaKeySourceOptions => ({
  localImageUrls: new Set<string>(),
  fingerprintByStorageUrl: new Map<string, string>(),
  ...overrides,
});

describe('extractShownMediaKeys', () => {
  it('returns empty keys for undefined data', () => {
    expect(extractShownMediaKeys(undefined, opts())).toEqual({
      imageKeys: [],
      videoKeys: [],
    });
  });

  it('derives fingerprint keys for ingested cloud images', () => {
    const data = { heroImageUrl: '/api/v1/storage/sess/conv/abc123' };
    const options = opts({
      fingerprintByStorageUrl: new Map([
        ['/api/v1/storage/sess/conv/abc123', 'fp-1'],
      ]),
    });
    expect(extractShownMediaKeys(data, options).imageKeys).toEqual(['fp:fp-1']);
  });

  it('falls back to storage hash keys', () => {
    const data = { heroImageUrl: '/api/v1/storage/sess/conv/abc123' };
    expect(extractShownMediaKeys(data, opts()).imageKeys).toEqual([
      'sh:abc123',
    ]);
  });

  it('excludes local user uploads', () => {
    const data = { heroImageUrl: '/api/v1/storage/sess/conv/abc123' };
    const options = opts({
      localImageUrls: new Set(['/api/v1/storage/sess/conv/abc123']),
    });
    expect(extractShownMediaKeys(data, options).imageKeys).toEqual([]);
  });

  it('collects video keys', () => {
    const data = {
      heroVideoUrl: 'https://www.youtube.com/watch?v=abc123def45',
    };
    expect(extractShownMediaKeys(data, opts()).videoKeys).toContain(
      'youtube:abc123def45',
    );
  });
});
