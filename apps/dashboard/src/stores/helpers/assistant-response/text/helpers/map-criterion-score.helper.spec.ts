import { describe, expect, it } from 'vitest';

import { mapCriterionScore } from './map-criterion-score.helper';

const toOptionalString = (v: unknown) =>
  typeof v === 'string' && v.trim() ? v : undefined;

describe('mapCriterionScore', () => {
  it('normalizes a criterion score entry', () => {
    expect(
      mapCriterionScore({ subject: 'A', score: 3 }, toOptionalString),
    ).toEqual({
      subject: 'A',
      score: 3,
    });
  });
});
