import { describe, expect, it } from 'vitest';

import { coerceLayout } from './coerce-layout.helper.js';

const gallery = (count: number) =>
  Array.from({ length: count }, (_, index) => ({
    imageUrl: `https://example.com/${index}.jpg`,
  }));

describe('coerceLayout', () => {
  it('keeps an allowed layout whose precondition holds', () => {
    expect(
      coerceLayout({ layout: 'editorial', quote: 'A real quote' }, [
        'classic',
        'editorial',
      ]),
    ).toBe('editorial');
  });

  it('falls back to classic when the model picks no layout', () => {
    expect(coerceLayout({}, ['classic', 'editorial'])).toBe('classic');
  });

  it('falls back to classic when the pick is not a known layout', () => {
    expect(coerceLayout({ layout: 'magazine' }, ['classic', 'editorial'])).toBe(
      'classic',
    );
  });

  it('falls back when the pick is known but not allowed here', () => {
    expect(
      coerceLayout({ layout: 'mosaic', galleryItems: gallery(3) }, [
        'classic',
        'editorial',
      ]),
    ).toBe('classic');
  });

  it('falls back to the first allowed layout when classic is not allowed', () => {
    expect(coerceLayout({}, ['mosaic', 'split'])).toBe('mosaic');
  });

  it('falls back to classic when nothing is allowed', () => {
    expect(coerceLayout({}, [])).toBe('classic');
  });

  describe('editorial', () => {
    const allowed = ['classic', 'editorial'] as const;

    it('rejects an empty or blank quote', () => {
      expect(
        coerceLayout({ layout: 'editorial', quote: '' }, [...allowed]),
      ).toBe('classic');
      expect(
        coerceLayout({ layout: 'editorial', quote: '   ' }, [...allowed]),
      ).toBe('classic');
    });

    it('rejects a non-string quote', () => {
      expect(
        coerceLayout({ layout: 'editorial', quote: 42 }, [...allowed]),
      ).toBe('classic');
    });
  });

  describe('split', () => {
    const allowed = ['classic', 'split'] as const;

    it('requires a hero image or hero video', () => {
      expect(coerceLayout({ layout: 'split' }, [...allowed])).toBe('classic');
    });

    it('accepts a hero image alone', () => {
      expect(
        coerceLayout(
          { layout: 'split', heroImageUrl: 'https://example.com/a.jpg' },
          [...allowed],
        ),
      ).toBe('split');
    });

    it('accepts a hero video alone', () => {
      expect(
        coerceLayout(
          { layout: 'split', heroVideoUrl: 'https://example.com/a.mp4' },
          [...allowed],
        ),
      ).toBe('split');
    });

    it('rejects blank media urls', () => {
      expect(
        coerceLayout({ layout: 'split', heroImageUrl: ' ', heroVideoUrl: '' }, [
          ...allowed,
        ]),
      ).toBe('classic');
    });
  });

  describe('mosaic', () => {
    const allowed = ['classic', 'mosaic'] as const;

    it('requires at least three gallery items', () => {
      expect(
        coerceLayout({ layout: 'mosaic', galleryItems: gallery(2) }, [
          ...allowed,
        ]),
      ).toBe('classic');
    });

    it('rejects a non-array gallery', () => {
      expect(
        coerceLayout({ layout: 'mosaic', galleryItems: 'not-an-array' }, [
          ...allowed,
        ]),
      ).toBe('classic');
    });

    it('accepts three gallery items', () => {
      expect(
        coerceLayout({ layout: 'mosaic', galleryItems: gallery(3) }, [
          ...allowed,
        ]),
      ).toBe('mosaic');
    });

    it('accepts more than three gallery items', () => {
      expect(
        coerceLayout({ layout: 'mosaic', galleryItems: gallery(6) }, [
          ...allowed,
        ]),
      ).toBe('mosaic');
    });
  });
});
