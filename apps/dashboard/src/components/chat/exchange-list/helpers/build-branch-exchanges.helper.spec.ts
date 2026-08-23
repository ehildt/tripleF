import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/conversation';

import { buildBranchExchanges } from './build-branch-exchanges.helper';

const userExchange: Exchange = {
  id: 'u1',
  role: 'user',
  content: 'hello',
  status: 'done',
  timestamp: 100,
  requestId: 'r1',
};

const assistantPartner: Exchange = {
  id: 'a1',
  role: 'assistant',
  content: 'hi',
  status: 'done',
  timestamp: 101,
  requestId: 'r1',
  toolCalls: [{ name: 'tool', status: 'done' }],
};

const assistantForeign: Exchange = {
  id: 'a2',
  role: 'assistant',
  content: 'other',
  status: 'done',
  timestamp: 102,
  requestId: 'r2',
};

describe('buildBranchExchanges', () => {
  it('copies the user exchange with fresh ids and requestId', () => {
    const [first] = buildBranchExchanges(userExchange, undefined);
    expect(first).toMatchObject({
      role: 'user',
      content: 'hello',
      status: 'done',
    });
    expect(first.id).not.toBe(userExchange.id);
    expect(first.requestId).not.toBe(userExchange.requestId);
    expect(typeof first.timestamp).toBe('number');
  });

  it('omits the assistant when the partner has a different requestId', () => {
    const result = buildBranchExchanges(userExchange, assistantForeign);
    expect(result).toHaveLength(1);
    expect(result[0].role).toBe('user');
  });

  it('copies the assistant partner with the same new requestId and clears toolCalls', () => {
    const result = buildBranchExchanges(userExchange, assistantPartner);
    expect(result).toHaveLength(2);
    const user = result[0];
    const assistant = result[1];
    expect(user.requestId).toBe(assistant.requestId);
    expect(assistant.toolCalls).toBeUndefined();
    expect(assistant.status).toBe('done');
  });
});
