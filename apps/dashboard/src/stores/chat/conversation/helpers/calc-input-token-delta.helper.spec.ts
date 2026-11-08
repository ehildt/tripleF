import { describe, expect, it } from 'vitest';

import { calcInputTokenDelta } from './calc-input-token-delta.helper';
import type { ExchangeLike } from './calc-input-token-delta.helper.types';

function assistant(promptEvalCount?: number, evalCount?: number): ExchangeLike {
  return { role: 'assistant', status: 'done', promptEvalCount, evalCount };
}

describe('calcInputTokenDelta', () => {
  it('returns the full cumulative input when there is no previous assistant', () => {
    expect(calcInputTokenDelta([], 300)).toBe(300);
    expect(calcInputTokenDelta([assistant(100, 50)], 300)).toBe(300);
  });

  it('subtracts the previous assistant prompt eval count', () => {
    // The previous assistant is the second-to-last done one.
    expect(calcInputTokenDelta([assistant(80), assistant(999)], 200)).toBe(120);
  });

  it('also subtracts the previous assistant response tokens', () => {
    expect(calcInputTokenDelta([assistant(80, 30), assistant(999)], 200)).toBe(
      90,
    );
  });

  it('clamps the delta at zero', () => {
    expect(
      calcInputTokenDelta([assistant(500, 500), assistant(999)], 100),
    ).toBe(0);
  });

  it('uses only done assistants when finding the previous one', () => {
    const exchanges: ExchangeLike[] = [
      assistant(80, 30),
      {
        role: 'assistant',
        status: 'streaming',
        promptEvalCount: 999,
        evalCount: 999,
      },
      assistant(999),
    ];
    // The streaming assistant is ignored; prev is the first done one.
    expect(calcInputTokenDelta(exchanges, 200)).toBe(90);
  });
});
