import { describe, expect, it } from 'vitest';

import { calcTokenPercent } from './calc-token-percent.helper';

describe('calcTokenPercent', () => {
  it('returns null when exchanges array is empty', () => {
    expect(calcTokenPercent([], '4096')).toBeNull();
  });

  it('returns percentage for a completed assistant exchange', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 200,
      },
    ];
    expect(calcTokenPercent(exchanges as any, '1000')).toBe(30);
  });

  it('uses the most recent assistant exchange instead of summing history', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 800,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 50,
      },
    ];
    expect(calcTokenPercent(exchanges as any, '1000')).toBe(15);
  });

  it('ignores assistant exchanges excluded from context', () => {
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
    ];
    expect(calcTokenPercent(exchanges as any, '1000')).toBe(15);
  });

  it('ignores pending or streaming assistant exchanges', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 400,
        evalCount: 100,
      },
      {
        role: 'assistant',
        status: 'streaming',
        promptEvalCount: undefined,
        evalCount: undefined,
      },
    ];
    expect(calcTokenPercent(exchanges as any, '1000')).toBe(50);
  });

  it('returns null when numCtx is 0', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 200,
      },
    ];
    expect(calcTokenPercent(exchanges as any, '0')).toBeNull();
  });

  it('returns null when no assistant exchange has token data', () => {
    const exchanges = [
      {
        role: 'user',
        status: 'done',
        content: 'hello',
      },
      {
        role: 'assistant',
        status: 'done',
      },
    ];
    expect(calcTokenPercent(exchanges as any, '4096')).toBeNull();
  });
});
