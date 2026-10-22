import { describe, expect, it } from 'vitest';

import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';
import { deriveInputTokenDelta } from './derive-input-token-delta.helper';

function assistant(
  overrides: Partial<TokenBearingExchange> = {},
): TokenBearingExchange {
  return { role: 'assistant', status: 'done', ...overrides };
}

describe('deriveInputTokenDelta', () => {
  it('returns the stored delta verbatim when present', () => {
    expect(
      deriveInputTokenDelta(undefined, assistant({ inputTokenDelta: 42 })),
    ).toBe(42);
  });

  it('returns null when no input-token data exists', () => {
    expect(deriveInputTokenDelta(undefined, assistant())).toBeNull();
  });

  it('uses the full cumulative count when there is no previous assistant', () => {
    expect(
      deriveInputTokenDelta(undefined, assistant({ promptEvalCount: 300 })),
    ).toBe(300);
  });

  it('subtracts the previous cumulative count and output', () => {
    expect(
      deriveInputTokenDelta(
        assistant({ promptEvalCount: 100, evalCount: 40 }),
        assistant({ promptEvalCount: 250 }),
      ),
    ).toBe(110);
  });
});
