import { describe, expect, it } from 'vitest';

import { buildFusionQuery } from './build-fusion-query.helper.js';

describe('buildFusionQuery', () => {
  it('uses distribution-based fusion when configured', () => {
    expect(
      buildFusionQuery({
        hybridFusion: 'dbsf',
        hybridDenseWeight: 2,
        hybridSparseWeight: 3,
      }),
    ).toEqual({ fusion: 'dbsf' });
  });

  it('omits weights for equal rank-fusion legs', () => {
    expect(
      buildFusionQuery({
        hybridFusion: 'rrf',
        hybridDenseWeight: 1,
        hybridSparseWeight: 1,
      }),
    ).toEqual({ rrf: {} });
  });

  it('passes weights when either leg differs from 1', () => {
    expect(
      buildFusionQuery({
        hybridFusion: 'rrf',
        hybridDenseWeight: 2,
        hybridSparseWeight: 1,
      }),
    ).toEqual({ rrf: { weights: [2, 1] } });

    expect(
      buildFusionQuery({
        hybridFusion: 'rrf',
        hybridDenseWeight: 1,
        hybridSparseWeight: 0.5,
      }),
    ).toEqual({ rrf: { weights: [1, 0.5] } });
  });
});
