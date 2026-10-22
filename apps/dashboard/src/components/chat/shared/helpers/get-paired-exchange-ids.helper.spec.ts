import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation/conversation.model';

import { getPairedExchangeIds } from './get-paired-exchange-ids.helper';

function exchange(
  id: string,
  requestId: string,
  role: 'user' | 'assistant' = 'user',
): Exchange {
  return { id, requestId, role, status: 'done' } as Exchange;
}

describe('getPairedExchangeIds', () => {
  it('pairs forward (user then assistant) on a shared request id', () => {
    expect(
      getPairedExchangeIds([exchange('u1', 'r1'), exchange('a1', 'r1')], 'u1'),
    ).toEqual(['u1', 'a1']);
  });

  it('pairs backward (assistant then user) on a shared request id', () => {
    expect(
      getPairedExchangeIds([exchange('u1', 'r1'), exchange('a1', 'r1')], 'a1'),
    ).toEqual(['u1', 'a1']);
  });

  it('returns the lone id when no partner shares the request id', () => {
    expect(
      getPairedExchangeIds([exchange('u1', 'r1'), exchange('a1', 'r2')], 'u1'),
    ).toEqual(['u1', 'u1']);
  });

  it('returns null when the id is not found', () => {
    expect(getPairedExchangeIds([exchange('u1', 'r1')], 'nope')).toBeNull();
  });
});
