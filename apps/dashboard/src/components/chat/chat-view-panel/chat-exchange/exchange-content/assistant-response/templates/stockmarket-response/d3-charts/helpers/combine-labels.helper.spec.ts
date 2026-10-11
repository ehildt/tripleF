import { describe, expect, it } from 'vitest';

import { combineLabels } from './combine-labels.helper';

describe('combineLabels', () => {
  it('returns an empty string for no labels', () => {
    expect(combineLabels([])).toBe('');
  });

  it('returns a single label unchanged', () => {
    expect(combineLabels(['1W LOW'])).toBe('1W LOW');
  });

  it('joins unique prefixes and keeps a shared suffix once', () => {
    expect(combineLabels(['1W LOW', '52W LOW'])).toBe('1W / 52W LOW');
  });

  it('joins full labels when suffixes differ', () => {
    expect(combineLabels(['Pivot', '52W LOW'])).toBe('Pivot / 52W LOW');
  });
});
