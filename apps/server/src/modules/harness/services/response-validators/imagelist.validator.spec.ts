import { describe, expect, it } from 'vitest';

import { validateImagelistOutput } from './imagelist.validator.js';

const validPayload = {
  category: 'nature',
  title: 'Mountains',
  subtitle: 'Alpine views',
  galleryItems: [],
};

describe('validateImagelistOutput', () => {
  it('accepts a valid payload and returns it serialized', () => {
    const result = validateImagelistOutput(validPayload);

    expect(result.valid).toBe(true);
    expect(JSON.parse(result.content!)).toEqual(validPayload);
  });

  it('rejects an empty title', () => {
    const result = validateImagelistOutput({ ...validPayload, title: '' });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Schema validation failed:');
    expect(result.error).toContain('title must not be empty');
  });

  it('rejects a gallery item without an alt text', () => {
    const result = validateImagelistOutput({
      ...validPayload,
      galleryItems: [{ imageUrl: 'https://example.com/a.jpg', title: 'A' }],
    });

    expect(result.valid).toBe(false);
    expect(result.error).toContain('galleryItems.0.imageAlt');
  });

  it('rejects a missing required collection', () => {
    const withoutGallery = {
      category: validPayload.category,
      title: validPayload.title,
      subtitle: validPayload.subtitle,
    };

    expect(validateImagelistOutput(withoutGallery).valid).toBe(false);
  });
});
