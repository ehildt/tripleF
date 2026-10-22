import { describe, expect, it } from 'vitest';

import { isSocketShared } from './is-socket-shared.helper';

describe('isSocketShared', () => {
  const conversations = [
    { id: 'c1', event: 'harness', roomId: 'room-1' },
    { id: 'c2', event: 'harness', roomId: 'room-2' },
    { id: 'c3', event: 'dlq', roomId: 'room-1' },
  ];

  it('is true when another conversation shares the event/room pair', () => {
    expect(isSocketShared(conversations, 'c2', 'harness', 'room-1')).toBe(true);
  });

  it('is false when no other conversation shares the room', () => {
    expect(isSocketShared(conversations, 'c1', 'harness', 'room-9')).toBe(
      false,
    );
  });

  it('matches a subscription binding too', () => {
    const subbed = [
      { id: 'c4', subscriptions: [{ event: 'harness', roomId: 'room-9' }] },
    ];
    expect(isSocketShared(subbed, 'c1', 'harness', 'room-9')).toBe(true);
  });

  it('normalizes an unset room to the empty-string room', () => {
    const noRoom = [{ id: 'c5', event: 'harness' }];
    expect(isSocketShared(noRoom, 'c1', 'harness', '')).toBe(true);
  });
});
