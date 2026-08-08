import { describe, expect, it } from 'vitest';

import type { IngestedImage } from '../media/download-and-ingest-images.types.js';

import { buildIngestedByUrlMap } from './build-ingested-by-url-map.helper.js';

const image = (sourceUrl: string, imageUrl: string): IngestedImage =>
  ({
    imageUrl,
    imageAlt: '',
    title: 'T',
    caption: '',
    source: 'cloud',
    hash: '',
    name: '',
    sourceUrl,
    width: 100,
    height: 200,
    fingerprint: '',
  }) as IngestedImage;

describe('buildIngestedByUrlMap', () => {
  it('maps ingested images by source url', () => {
    const map = buildIngestedByUrlMap([
      image('https://src.com/a.jpg', '/storage/a'),
    ]);
    expect(map.get('https://src.com/a.jpg')).toEqual({
      imageUrl: '/storage/a',
      title: 'T',
      width: 100,
      height: 200,
    });
  });

  it('returns an empty map for undefined input', () => {
    expect(buildIngestedByUrlMap(undefined as never).size).toBe(0);
  });
});
