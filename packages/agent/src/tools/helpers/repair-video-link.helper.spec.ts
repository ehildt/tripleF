import { describe, expect, it } from 'vitest';

import { repairVideoLink } from './repair-video-link.helper.js';

describe('repairVideoLink', () => {
  it('rebuilds a canonical watch url from a serper-contaminated watch link', () => {
    // Real payload shape observed from google.serper.dev/videos: the result
    // title's HTML is glued onto the link after the intact video ID.
    expect(
      repairVideoLink(
        'https://www.youtube.com/watch?v=R8htow_6tRc:J<b>Wuthering Waves</b> Official Release <b>Trailer</b> | Waking of a WorldB\uFFFD',
      ),
    ).toBe('https://www.youtube.com/watch?v=R8htow_6tRc');
  });

  it('rebuilds a canonical watch url from a contaminated shorts link', () => {
    expect(repairVideoLink('https://www.youtube.com/shorts/647lXug4NWw:@Hegseth announces <b>tests</b>B\uFFFD')).toBe(
      'https://www.youtube.com/watch?v=647lXug4NWw',
    );
  });

  it('collapses clean watch variants onto the canonical form', () => {
    expect(repairVideoLink('https://www.youtube.com/watch?v=abc123def45&t=2s')).toBe(
      'https://www.youtube.com/watch?v=abc123def45',
    );
  });

  it('rebuilds share, embed, and nocookie variants onto the canonical form', () => {
    expect(repairVideoLink('https://youtu.be/abc123def45')).toBe('https://www.youtube.com/watch?v=abc123def45');
    expect(repairVideoLink('https://m.youtube.com/embed/abc123def45')).toBe(
      'https://www.youtube.com/watch?v=abc123def45',
    );
    expect(repairVideoLink('https://www.youtube-nocookie.com/embed/abc123def45')).toBe(
      'https://www.youtube.com/watch?v=abc123def45',
    );
  });

  it('drops youtube-shaped links whose id is not exactly 11 characters', () => {
    expect(repairVideoLink('https://www.youtube.com/watch?v=v0')).toBeUndefined();
    expect(repairVideoLink('https://www.youtube.com/watch?v=v0:<b>junk</b>B\uFFFD')).toBeUndefined();
    expect(repairVideoLink('https://www.youtube.com/watch?v=this-id-is-way-too-long-for-youtube')).toBeUndefined();
  });

  it('passes clean non-youtube links through unchanged', () => {
    expect(repairVideoLink('https://vimeo.com/123456789')).toBe('https://vimeo.com/123456789');
    expect(repairVideoLink('https://www.dailymotion.com/video/x8abc123')).toBe(
      'https://www.dailymotion.com/video/x8abc123',
    );
  });

  it('drops contaminated non-youtube links', () => {
    expect(
      repairVideoLink(
        'https://www.khou.com/video/news/health/new-fda-approved-blood-test/285-faaaf8f5:FNew FDA-approved blood <b>test</b>B\uFFFD',
      ),
    ).toBeUndefined();
  });

  it('drops empty links', () => {
    expect(repairVideoLink('')).toBeUndefined();
  });
});
