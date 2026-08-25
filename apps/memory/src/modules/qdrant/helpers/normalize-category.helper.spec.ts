import { describe, expect, it } from 'vitest';

import { normalizeCategory } from './normalize-category.helper.js';

describe('normalizeCategory', () => {
  it('lowercases and trims a category label', () => {
    expect(normalizeCategory('  Games ')).toBe('games');
  });

  it('collapses case variants to one canonical form (PDF/pdf)', () => {
    expect(normalizeCategory('PDF')).toBe('pdf');
    expect(normalizeCategory('pdf')).toBe('pdf');
  });

  it('folds whitespace and underscores to a single hyphen', () => {
    expect(normalizeCategory('web dev')).toBe('web-dev');
    expect(normalizeCategory('web_dev')).toBe('web-dev');
    expect(normalizeCategory('web  dev')).toBe('web-dev');
  });

  it('never merges semantically different labels (dog vs animal)', () => {
    expect(normalizeCategory('dog')).toBe('dog');
    expect(normalizeCategory('animal')).toBe('animal');
  });

  it('returns undefined for empty or whitespace-only input', () => {
    expect(normalizeCategory('')).toBeUndefined();
    expect(normalizeCategory('   ')).toBeUndefined();
    expect(normalizeCategory(undefined)).toBeUndefined();
    expect(normalizeCategory(null)).toBeUndefined();
  });

  it('returns undefined for overlong labels', () => {
    expect(normalizeCategory('x'.repeat(41))).toBeUndefined();
  });
});
