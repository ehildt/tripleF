import { describe, expect, it } from 'vitest';

import type { Exchange } from '../conversation.model';
import { prunePairedExchange } from './prune-paired-exchange.helper';

function makeExchange(
  id: string,
  role: Exchange['role'],
  requestId?: string,
): Exchange {
  return { id, role, content: id, requestId, status: 'done', timestamp: 1 };
}

describe('prunePairedExchange', () => {
  it('removes both halves of a user/assistant pair sharing a request id', () => {
    const exchanges = [
      makeExchange('u1', 'user', 'req-1'),
      makeExchange('a1', 'assistant', 'req-1'),
      makeExchange('u2', 'user', 'req-2'),
    ];

    expect(prunePairedExchange(exchanges, 'u1').map((e) => e.id)).toEqual([
      'u2',
    ]);
  });

  it('removes only the targeted exchange without a following pair', () => {
    const exchanges = [
      makeExchange('a1', 'assistant', 'req-1'),
      makeExchange('u2', 'user', 'req-2'),
    ];

    expect(prunePairedExchange(exchanges, 'a1').map((e) => e.id)).toEqual([
      'u2',
    ]);
  });

  it('returns the same array when the id is unknown', () => {
    const exchanges = [makeExchange('u1', 'user', 'req-1')];

    expect(prunePairedExchange(exchanges, 'missing')).toBe(exchanges);
  });
});
