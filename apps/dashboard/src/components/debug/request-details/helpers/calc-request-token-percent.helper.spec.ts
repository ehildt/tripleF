import { describe, expect, it } from 'vitest';

import { calcRequestTokenPercent } from './calc-request-token-percent.helper';

describe('calcRequestTokenPercent', () => {
  it('returns null when no token counts are set', () => {
    expect(calcRequestTokenPercent({} as any)).toBeNull();
  });

  it('returns null when numCtx is missing or zero', () => {
    expect(
      calcRequestTokenPercent({ promptEvalCount: 10, evalCount: 5 } as any),
    ).toBeNull();
    expect(
      calcRequestTokenPercent({
        promptEvalCount: 10,
        evalCount: 5,
        numCtx: '0',
      } as any),
    ).toBeNull();
  });

  it('rounds the percentage of used tokens to whole numbers', () => {
    expect(
      calcRequestTokenPercent({
        promptEvalCount: 100,
        evalCount: 50,
        numCtx: '1000',
      } as any),
    ).toBe(15);
  });

  it('handles only promptEvalCount', () => {
    expect(
      calcRequestTokenPercent({
        promptEvalCount: 500,
        numCtx: '1000',
      } as any),
    ).toBe(50);
  });
});
