import { describe, expect, it } from 'vitest';

import { formatParameterSize } from './format-parameter-size.helper';

describe('formatParameterSize', () => {
  it('passes compact labels from local tags through unchanged', () => {
    expect(formatParameterSize('8.0B')).toBe('8.0B');
    expect(formatParameterSize('7B')).toBe('7B');
    expect(formatParameterSize('135M')).toBe('135M');
  });

  it('compacts raw parameter counts to billions', () => {
    expect(formatParameterSize('116829156672')).toBe('117B');
    expect(formatParameterSize('8000000000')).toBe('8B');
  });

  it('compacts raw parameter counts to millions', () => {
    expect(formatParameterSize('355000000')).toBe('355M');
    expect(formatParameterSize('2000000')).toBe('2M');
  });

  it('keeps small raw counts as-is', () => {
    expect(formatParameterSize('999999')).toBe('999999');
  });
});
