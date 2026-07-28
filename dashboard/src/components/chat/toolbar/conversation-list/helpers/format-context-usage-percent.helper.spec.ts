import { describe, expect, it } from 'vitest';

import { formatContextUsagePercent } from './format-context-usage-percent.helper';

describe('formatContextUsagePercent', () => {
  it('returns "--" when exchanges array is empty', () => {
    expect(formatContextUsagePercent([], '4096')).toBe('--');
  });

  it('returns percentage when exchanges have token counts', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        inputTokenDelta: 100,
        evalCount: 200,
      },
    ];
    expect(formatContextUsagePercent(exchanges as any, '1000')).toBe('30.00%');
  });

  it('returns "--" when numCtx is "0"', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 200,
      },
    ];
    expect(formatContextUsagePercent(exchanges as any, '0')).toBe('--');
  });

  it('returns "--" when numCtx is empty string', () => {
    const exchanges = [
      {
        role: 'assistant',
        status: 'done',
        promptEvalCount: 100,
        evalCount: 200,
      },
    ];
    expect(formatContextUsagePercent(exchanges as any, '')).toBe('--');
  });

  it('returns "--" when only user exchanges exist (no assistant tokens)', () => {
    const exchanges = [{ role: 'user', status: 'done', content: 'hello' }];
    expect(formatContextUsagePercent(exchanges as any, '4096')).toBe('--');
  });
});
