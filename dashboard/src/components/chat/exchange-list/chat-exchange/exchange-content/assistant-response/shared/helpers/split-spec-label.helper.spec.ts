import { describe, expect, it } from 'vitest';

import { splitSpecLabel } from './split-spec-label.helper';

describe('splitSpecLabel', () => {
  it('splits a "Label: value" row into label and value', () => {
    expect(splitSpecLabel('Market cap: $5.6T')).toEqual({
      label: 'Market cap',
      value: '$5.6T',
    });
  });

  it('trims whitespace around the colon', () => {
    expect(splitSpecLabel('P/E : 45.2')).toEqual({
      label: 'P/E',
      value: '45.2',
    });
  });

  it('returns the full text as value when there is no colon', () => {
    expect(splitSpecLabel('Strong buy')).toEqual({
      label: '',
      value: 'Strong buy',
    });
  });

  it('treats a leading colon as having no label', () => {
    expect(splitSpecLabel(': value only')).toEqual({
      label: '',
      value: ': value only',
    });
  });

  it('splits only at the first colon', () => {
    expect(splitSpecLabel('RSI (14): 72: high')).toEqual({
      label: 'RSI (14)',
      value: '72: high',
    });
  });
});
