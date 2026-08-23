import { describe, expect, it } from 'vitest';

import { videolistToText } from './videolist-to-text.helper';

describe('videolistToText', () => {
  it('keeps the exact marker parsed by the server-side video dedupe', () => {
    const result = videolistToText({
      title: 'Nioh 3 trailers',
      videoGalleryItems: [
        { videoUrl: 'https://youtube.com/watch?v=1', title: 'Reveal' },
      ],
    });

    // CONTRACT: collectHistoryVideoUrls (server sanitize step) looks for
    // this exact marker and extracts parenthesized urls after it.
    expect(result).toContain('Previously shown videos (skip these videoUrls):');
    expect(result).toContain('- Reveal (https://youtube.com/watch?v=1)');
  });

  it('lists every video with a parenthesized url', () => {
    const result = videolistToText({
      category: 'Playlist',
      title: 'Daft Punk videos',
      subtitle: 'Music videos',
      videoGalleryItems: [
        { videoUrl: 'https://youtube.com/watch?v=1', title: 'One More Time' },
        { videoUrl: 'https://youtube.com/watch?v=2' },
        { title: 'no url' } as never,
      ],
    });

    expect(result).toContain('Category: Playlist');
    expect(result).toContain('Title: Daft Punk videos');
    expect(result).toContain('- One More Time (https://youtube.com/watch?v=1)');
    expect(result).toContain('- video (https://youtube.com/watch?v=2)');
    expect(result).not.toContain('no url');
  });

  it('returns empty string for empty data', () => {
    expect(videolistToText({})).toBe('');
  });
});
