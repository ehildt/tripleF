import { describe, expect, it } from 'vitest';

import { mapEvaluationSubject } from './map-evaluation-subject.helper';

const toOptionalString = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v : undefined;
const normalizeKeyFindings = (v: unknown) =>
  Array.isArray(v) ? v.map((i) => ({ text: String(i) })) : undefined;

describe('mapEvaluationSubject', () => {
  it('normalizes a subject profile', () => {
    const result = mapEvaluationSubject(
      { name: 'A', score: 5, strengths: ['s'] },
      toOptionalString,
      normalizeKeyFindings,
    );
    expect(result).toEqual({
      name: 'A',
      description: undefined,
      strengths: [{ text: 's' }],
      weaknesses: undefined,
      score: 5,
      scoreLabel: undefined,
    });
  });
});
