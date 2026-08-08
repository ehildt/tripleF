import { describe, expect, it } from 'vitest';

import { calcTotalContextPercentage } from './calc-token-percent.helper';

describe('calcTotalContextPercentage', () => {
  it('returns null when exchanges array is empty', () => {
    expect(calcTotalContextPercentage([], '4096')).toBeNull();
  });

  it('returns percentage for a completed assistant exchange', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 200,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('30.00');
  });

  it('sums token counts across all included assistant exchanges', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 400,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 50,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('65.00');
  });

  it('caps the percentage at 100', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 600,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 600,
        evalCount: 100,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('100.00');
  });

  it('ignores assistant exchanges excluded from context', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 50,
      },
      {
        role: 'assistant',
        status: 'done',
        included: false,
        inputTokenDelta: 900,
        evalCount: 0,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('15.00');
  });

  it('ignores pending or streaming assistant exchanges', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 400,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'streaming',
        inputTokenDelta: undefined,
        evalCount: undefined,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('50.00');
  });

  it('returns null when numCtx is 0', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 200,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '0')).toBeNull();
  });

  it('returns null when no assistant exchange has token data', () => {
    const exchanges = [
      {
        role: 'user',
        status: 'done',
        content: 'hello',
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '4096')).toBeNull();
  });

  it('returns null when a done assistant has no token data yet', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        content: 'hi',
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '4096')).toBeNull();
  });

  it('derives input tokens from promptEvalCount when inputTokenDelta is missing', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 200,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('30.00');
  });

  it('counts input tokens when only promptEvalCount exists', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 150,
      },
    ];
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('15.00');
  });

  it('derives per-turn deltas across turns without inputTokenDelta', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 400,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 900,
        evalCount: 50,
      },
    ];
    // Turn 2 inputs: 900 - 400 (prev cumulative) - 100 (prev output) = 400.
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('95.00');
  });

  it('mixes stored deltas with promptEvalCount-derived ones', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 400,
        evalCount: 100,
        promptEvalCount: 500,
      },
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 900,
        evalCount: 50,
      },
    ];
    // Turn 2 inputs: 900 - 500 (prev cumulative) - 100 (prev output) = 300.
    expect(calcTotalContextPercentage(exchanges as any, '1000')).toBe('85.00');
  });

  it('excluded exchanges do not contribute but still anchor delta derivation', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 50,
      },
      {
        role: 'assistant',
        status: 'done',
        included: false,
        promptEvalCount: 900,
        evalCount: 0,
      },
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 1900,
        evalCount: 100,
      },
    ];
    // Turn 3 inputs derive from the excluded turn (1900 - 900 = 1000):
    // (100 + 50) + (1000 + 100) = 1250 of 2000 = 62.50.
    expect(calcTotalContextPercentage(exchanges as any, '2000')).toBe('62.50');
  });
});
