import { describe, expect, it } from 'vitest';

import type { IngestedImage } from '../media/download-and-ingest-images.types.js';
import type { ExtractedImageItem } from '../media/extract-media-from-tools.types.js';

import { rewriteCandidatesWithIngested } from './rewrite-candidates-with-ingested.helper.js';

const ingested = (sourceUrl: string, imageUrl: string): IngestedImage =>
  ({
    imageUrl,
    imageAlt: '',
    title: 'Ingested',
    caption: '',
    source: 'cloud',
    hash: '',
    name: '',
    sourceUrl,
    width: 50,
    height: 60,
    fingerprint: '',
  }) as IngestedImage;

describe('rewriteCandidatesWithIngested', () => {
  it('rewrites external urls to their ingested storage url', () => {
    const candidates: ExtractedImageItem[] = [
      { imageUrl: 'https://src.com/a.jpg', title: 'Orig' },
    ];
    const map = new Map([
      [
        'https://src.com/a.jpg',
        ingested('https://src.com/a.jpg', '/storage/a'),
      ],
    ]);
    const result = rewriteCandidatesWithIngested(candidates, map);
    expect(result[0].imageUrl).toBe('/storage/a');
    expect(result[0].title).toBe('Ingested');
    expect(result[0].width).toBe(50);
    expect(result[0].height).toBe(60);
  });

  it('drops external urls without an ingested match', () => {
    const candidates: ExtractedImageItem[] = [
      { imageUrl: 'https://src.com/a.jpg' },
    ];
    expect(rewriteCandidatesWithIngested(candidates, new Map())).toEqual([]);
  });

  it('keeps non-external urls unchanged', () => {
    const candidates: ExtractedImageItem[] = [{ imageUrl: '/local/a.jpg' }];
    const result = rewriteCandidatesWithIngested(candidates, new Map());
    expect(result).toEqual([{ imageUrl: '/local/a.jpg' }]);
  });

  it('collapses duplicate storage urls', () => {
    const candidates: ExtractedImageItem[] = [
      { imageUrl: 'https://src.com/a.jpg' },
      { imageUrl: 'https://src.com/b.jpg' },
    ];
    const map = new Map([
      [
        'https://src.com/a.jpg',
        ingested('https://src.com/a.jpg', '/storage/a'),
      ],
      [
        'https://src.com/b.jpg',
        ingested('https://src.com/b.jpg', '/storage/a'),
      ],
    ]);
    expect(rewriteCandidatesWithIngested(candidates, map)).toHaveLength(1);
  });
});
