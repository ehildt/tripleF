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
});
