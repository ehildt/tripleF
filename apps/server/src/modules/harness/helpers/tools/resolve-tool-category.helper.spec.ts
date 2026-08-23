import { describe, expect, it } from 'vitest';

import { resolveToolCategory } from './resolve-tool-category.helper.js';

describe('resolveToolCategory', () => {
  it('maps browser tools', () => {
    expect(resolveToolCategory('browser_navigate')).toBe('browser');
  });

  it('maps request/variants tools', () => {
    expect(resolveToolCategory('requestImageVariants')).toBe('variants');
  });

  it('maps eodhd tools to market', () => {
    expect(resolveToolCategory('eodhdHistory')).toBe('market');
  });

  it('maps shopping, reviews, and places', () => {
    expect(resolveToolCategory('serperShoppingSearch')).toBe('shopping');
    expect(resolveToolCategory('serperBusinessReviewsSearch')).toBe('reviews');
    expect(resolveToolCategory('serperPlacesSearch')).toBe('places');
  });

  it('maps image and video searches', () => {
    expect(resolveToolCategory('serperImageSearch')).toBe('images');
    expect(resolveToolCategory('serperVideoSearch')).toBe('videos');
  });

  it('maps news searches', () => {
    expect(resolveToolCategory('serperNewsSearch')).toBe('news');
  });

  it('maps fetch and webpage tools', () => {
    expect(resolveToolCategory('serperWebpageScrape')).toBe('fetch');
  });

  it('maps generic search/web tools', () => {
    expect(resolveToolCategory('serperWebSearch')).toBe('web');
  });

  it('falls back to other', () => {
    expect(resolveToolCategory('unknownTool')).toBe('other');
  });
});
