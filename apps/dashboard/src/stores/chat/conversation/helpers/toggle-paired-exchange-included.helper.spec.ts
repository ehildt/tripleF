import { describe, expect, it } from 'vitest';

import type { Exchange } from '../conversation.model';
import { togglePairedExchangeIncluded } from './toggle-paired-exchange-included.helper';

function makeExchange(
  id: string,
  role: Exchange['role'],
  requestId?: string,
  included?: boolean,
): Exchange {
  return {
    id,
    role,
    content: id,
    requestId,
    included,
    status: 'done',
    timestamp: 1,
  };
}

describe('togglePairedExchangeIncluded', () => {
  it('toggles the partner sharing the request id together', () => {
    const exchanges = [
      makeExchange('u1', 'user', 'req-1'),
      makeExchange('a1', 'assistant', 'req-1'),
      makeExchange('u2', 'user', 'req-2'),
    ];

    const next = togglePairedExchangeIncluded(exchanges, 'u1')!;

    expect(next.map((e) => e.included)).toEqual([false, false, undefined]);
  });

  it('pairs backward for an assistant exchange with no following partner', () => {
    const exchanges = [
      makeExchange('u1', 'user', 'req-1'),
      makeExchange('a1', 'assistant', 'req-1'),
    ];

    const next = togglePairedExchangeIncluded(exchanges, 'a1')!;

    expect(next[0].included).toBe(false);
    expect(next[1].included).toBe(false);
  });

  it('toggles excluded exchanges back to included', () => {
    const exchanges = [
      makeExchange('u1', 'user', 'req-1', false),
      makeExchange('a1', 'assistant', 'req-1', false),
    ];

    const next = togglePairedExchangeIncluded(exchanges, 'u1')!;

    expect(next.map((e) => e.included)).toEqual([true, true]);
  });

  it('returns null when the id is unknown', () => {
    expect(
      togglePairedExchangeIncluded([makeExchange('u1', 'user', 'req-1')], 'x'),
    ).toBeNull();
  });
});
