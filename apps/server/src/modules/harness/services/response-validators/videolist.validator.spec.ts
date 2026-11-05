import { describe, expect, it } from 'vitest';

import { validateVideolistOutput } from './videolist.validator.js';

const validVideo = {
  videoUrl: 'https://www.youtube.com/watch?v=abc123',
  title: 'Review',
  caption: 'Full review',
};

const validPayload = {
  category: 'tech',
  title: 'Reviews',
  subtitle: 'Latest videos',
  videoGalleryItems: [validVideo],
};

describe('validateVideolistOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateVideolistOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('rejects an empty title', () => {
    const result = validateVideolistOutput({ ...validPayload, title: '' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
  });

  it('rejects a video entry without a caption', () => {
    const result = validateVideolistOutput({
      ...validPayload,
      videoGalleryItems: [{ ...validVideo, caption: undefined }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('videoGalleryItems.0.caption');
  });

  it('rejects a video entry with an untrusted url', () => {
    const result = validateVideolistOutput({
      ...validPayload,
      videoGalleryItems: [{ ...validVideo, videoUrl: 'javascript:alert(1)' }],
    });

    expect(result.valid).toBe(false);
  });
});
