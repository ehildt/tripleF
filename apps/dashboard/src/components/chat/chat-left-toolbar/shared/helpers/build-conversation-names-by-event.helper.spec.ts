import { describe, expect, it } from 'vitest';

import { buildConversationNamesByEvent } from './build-conversation-names-by-event.helper';

describe('buildConversationNamesByEvent', () => {
  it("maps each event::room key to the bound conversations' titles", () => {
    const names = buildConversationNamesByEvent(
      [{ event: 'e', roomId: 'r' }],
      [
        { title: 'Alpha', event: 'e', roomId: 'r' },
        { title: 'Beta', event: 'e', roomId: 'r', subscriptions: [] },
        { title: 'Other', event: 'x', roomId: 'r' },
      ],
    );
    expect(names).toEqual({ 'e::r': ['Alpha', 'Beta'] });
  });

  it('labels untitled conversations', () => {
    const names = buildConversationNamesByEvent(
      [{ event: 'x', roomId: '' }],
      [{ title: '', event: 'x', roomId: '' }],
    );
    expect(names).toEqual({ 'x::': ['(untitled)'] });
  });

  it('matches a conversation through its extra subscriptions', () => {
    const names = buildConversationNamesByEvent(
      [{ event: 'e', roomId: 'r' }],
      [{ title: 'Via sub', subscriptions: [{ event: 'e', roomId: 'r' }] }],
    );
    expect(names).toEqual({ 'e::r': ['Via sub'] });
  });

  it('returns an empty map for no subscriptions', () => {
    expect(buildConversationNamesByEvent([], [])).toEqual({});
  });
});
