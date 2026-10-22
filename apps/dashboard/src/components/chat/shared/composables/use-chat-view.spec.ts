import { beforeEach, describe, expect, it } from 'vitest';

import { useChatView } from './use-chat-view';

describe('useChatView', () => {
  beforeEach(() => {
    // Module-scope singleton: reset the shared refs between tests.
    const view = useChatView();
    view.setActiveUserExchangeId(null);
    view.scrollToExchangeRequest.value = null;
  });

  it('starts with no active exchange and no scroll request', () => {
    const view = useChatView();
    expect(view.activeUserExchangeId.value).toBeNull();
    expect(view.scrollToExchangeRequest.value).toBeNull();
  });

  it('tracks the active user exchange id', () => {
    const view = useChatView();

    view.setActiveUserExchangeId('ex-1');
    expect(view.activeUserExchangeId.value).toBe('ex-1');

    view.setActiveUserExchangeId(null);
    expect(view.activeUserExchangeId.value).toBeNull();
  });

  it('issues a one-shot scroll request with a bumping request id', () => {
    const view = useChatView();

    view.requestScrollToExchange('ex-2');
    const first = view.scrollToExchangeRequest.value;
    expect(first?.exchangeId).toBe('ex-2');
    expect(first?.requestId).toBeGreaterThan(0);

    // A repeat request to the same exchange must still re-scroll — the
    // requestId grows so watchers on it re-fire.
    view.requestScrollToExchange('ex-2');
    const second = view.scrollToExchangeRequest.value;
    expect(second?.exchangeId).toBe('ex-2');
    expect(second?.requestId).toBe((first?.requestId ?? 0) + 1);
  });
});
