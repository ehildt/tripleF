import { describe, expect, it } from 'vitest';

import { calcCurrentContextTokens } from './calc-current-context-tokens.helper';
import type { TokenBearingExchange } from './calc-total-context-percentage.helper.types';

function assistant(
  inputTokenDelta?: number,
  evalCount?: number,
  included?: boolean,
  promptEvalCount?: number,
): TokenBearingExchange {
  return {
    role: 'assistant',
    status: 'done',
    inputTokenDelta,
    evalCount,
    included,
    promptEvalCount,
  };
}

describe('calcCurrentContextTokens', () => {
  it('returns null when there are no completed assistants', () => {
    expect(calcCurrentContextTokens([])).toBeNull();
  });

  it('sums the stored per-turn delta plus response tokens', () => {
    expect(
      calcCurrentContextTokens([assistant(100, 50), assistant(200, 80)]),
    ).toBe(430);
  });

  it('excludes a non-included turn from its own contribution only', () => {
    expect(
      calcCurrentContextTokens([assistant(100, 50), assistant(200, 80, false)]),
    ).toBe(150);
  });

  it('falls back to a cumulative estimate when the delta is missing', () => {
    // promptEvalCount is cumulative: second turn contributes the delta.
    expect(
      calcCurrentContextTokens([
        assistant(undefined, 40, true, 100),
        assistant(undefined, 60, true, 250),
      ]),
    ).toBe(100 + 40 + (250 - 100 - 40) + 60);
  });

  it('returns null when no completed assistant carries token data', () => {
    expect(
      calcCurrentContextTokens([{ role: 'assistant', status: 'done' }]),
    ).toBeNull();
  });
});
