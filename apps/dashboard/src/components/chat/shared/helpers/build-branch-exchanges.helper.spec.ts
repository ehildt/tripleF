import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation/conversation.model';

import { buildBranchExchanges } from './build-branch-exchanges.helper';

function exchange(
  id: string,
  requestId: string,
  role: 'user' | 'assistant' = 'user',
): Exchange {
  return { id, requestId, role, status: 'done' } as Exchange;
}

describe('buildBranchExchanges', () => {
  it('copies the user exchange with a fresh id and done status', () => {
    const branched = buildBranchExchanges(exchange('u1', 'r1'), undefined);
    expect(branched).toHaveLength(1);
    expect(branched[0].id).not.toBe('u1');
    expect(branched[0].status).toBe('done');
  });

  it('copies the assistant partner when it shares the request id', () => {
    const branched = buildBranchExchanges(
      exchange('u1', 'r1'),
      exchange('a1', 'r1', 'assistant'),
    );
    expect(branched).toHaveLength(2);
    expect(branched[0].requestId).toBe(branched[1].requestId);
    expect(branched[0].requestId).not.toBe('r1');
  });

  it('ignores a partner with a different request id', () => {
    const branched = buildBranchExchanges(
      exchange('u1', 'r1'),
      exchange('a1', 'r2', 'assistant'),
    );
    expect(branched).toHaveLength(1);
  });
});
