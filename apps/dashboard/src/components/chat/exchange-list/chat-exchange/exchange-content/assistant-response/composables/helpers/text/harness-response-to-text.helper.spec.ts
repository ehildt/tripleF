import { describe, expect, it } from 'vitest';

import { harnessResponseToText } from './harness-response-to-text.helper';

describe('harnessResponseToText', () => {
  it('dispatches to the template-specific transform', () => {
    const result = harnessResponseToText('videolist', {
      title: 'Trailers',
      videoGalleryItems: [
        { videoUrl: 'https://youtube.com/watch?v=1', title: 'Reveal' },
      ],
    });

    expect(result).toContain('Title: Trailers');
    expect(result).toContain('Previously shown videos (skip these videoUrls):');
    expect(result).toContain('- Reveal (https://youtube.com/watch?v=1)');
  });

  it('falls back to the generic flattener for unknown templates', () => {
    const result = harnessResponseToText('unknown-template', {
      title: 'Legacy',
      summary: 'Old response.',
    });

    expect(result).toContain('Title: Legacy');
    expect(result).toContain('Old response.');
  });

  it('falls back to the generic flattener when no template is set', () => {
    const result = harnessResponseToText(undefined, {
      title: 'Legacy',
      summary: 'Old response.',
    });

    expect(result).toContain('Title: Legacy');
    expect(result).toContain('Old response.');
  });
});
