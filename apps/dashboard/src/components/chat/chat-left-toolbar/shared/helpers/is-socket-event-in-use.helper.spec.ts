import { describe, expect, it } from 'vitest';

import { isSocketEventInUse } from './is-socket-event-in-use.helper';

describe('isSocketEventInUse', () => {
  const conversations = [
    { id: 'c1', event: 'harness' },
    { id: 'c2', event: 'dlq' },
  ];

  it('is false when no conversation or subscription keeps the event', () => {
    expect(isSocketEventInUse(conversations, [], 'c1', 'harness')).toBe(false);
  });

  it('is true when another conversation keeps the event as its own binding', () => {
    expect(isSocketEventInUse(conversations, [], 'c1', 'dlq')).toBe(true);
  });

  it('is true when another conversation keeps the event via a subscription', () => {
    const withSub = [{ id: 'c3', subscriptions: [{ event: 'harness' }] }];
    expect(isSocketEventInUse(withSub, [], 'c1', 'harness')).toBe(true);
  });

  it('is true when a standalone subscription keeps the event', () => {
    expect(
      isSocketEventInUse([], [{ event: 'harness' }], 'c1', 'harness'),
    ).toBe(true);
  });
});
