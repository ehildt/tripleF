import { describe, expect, it } from 'vitest';

import { displayValue } from './display-value.helper';

describe('displayValue', () => {
  it('returns formatted value when present', () => {
    expect(displayValue('x', '', 'Label', (v) => v.toUpperCase())).toBe('X');
  });

  it('returns placeholder when value is empty', () => {
    expect(displayValue('', 'placeholder', 'Label')).toBe('placeholder');
  });

  it('falls back to label when placeholder is empty', () => {
    expect(displayValue('', '', 'Label')).toBe('Label');
  });
});
