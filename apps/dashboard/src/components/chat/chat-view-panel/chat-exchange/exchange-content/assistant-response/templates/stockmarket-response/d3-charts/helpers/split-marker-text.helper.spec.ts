import { describe, expect, it } from 'vitest';

import { splitMarkerText } from './split-marker-text.helper';

describe('splitMarkerText', () => {
  it('splits the pivot "price word" format', () => {
    expect(splitMarkerText('216.94 Sell')).toEqual({
      price: '216.94',
      word: 'Sell',
    });
  });

  it('splits the model "word @ price" format', () => {
    expect(splitMarkerText('Buy @ 83')).toEqual({
      price: '83',
      word: 'Buy',
    });
  });

  it('keeps a word-only label on the word line', () => {
    expect(splitMarkerText('D')).toEqual({ price: null, word: 'D' });
  });

  it('handles null and empty labels', () => {
    expect(splitMarkerText(null)).toEqual({ price: null, word: null });
    expect(splitMarkerText('')).toEqual({ price: null, word: null });
  });
});
