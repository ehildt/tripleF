import { describe, expect, it } from 'vitest';

import { formatEvaluationScore } from './format-evaluation-score.helper';

describe('formatEvaluationScore', () => {
  it('prefers the model label over the fixed scale', () => {
    expect(formatEvaluationScore(8, 'Great')).toBe('Great');
  });

  it('appends the fixed scale when no label is present', () => {
    expect(formatEvaluationScore(8)).toBe('8/10');
  });

  it('returns undefined when both are absent', () => {
    expect(formatEvaluationScore()).toBeUndefined();
  });

  it('trims an empty label down to nothing', () => {
    expect(formatEvaluationScore(8, '   ')).toBe('8/10');
  });
});
