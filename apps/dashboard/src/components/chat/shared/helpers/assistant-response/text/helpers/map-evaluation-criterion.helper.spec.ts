import { describe, expect, it } from 'vitest';

import { mapEvaluationCriterion } from './map-evaluation-criterion.helper';

const toOptionalString = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v : undefined;
const normalizeCriterionScores = (v: unknown) =>
  Array.isArray(v) ? (v as never[]) : undefined;

describe('mapEvaluationCriterion', () => {
  it('normalizes a criterion', () => {
    const result = mapEvaluationCriterion(
      { name: 'Speed', scores: [{ subject: 'A', score: 3 }] },
      toOptionalString,
      normalizeCriterionScores,
    );
    expect(result.name).toBe('Speed');
    expect(result.scores).toEqual([{ subject: 'A', score: 3 }]);
  });
});
