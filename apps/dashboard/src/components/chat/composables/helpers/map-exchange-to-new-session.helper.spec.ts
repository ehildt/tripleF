import { describe, expect, it } from 'vitest';

import { mapExchangeToNewSession } from './map-exchange-to-new-session.helper';

describe('mapExchangeToNewSession', () => {
  it('re-tags an exchange copy to the new conversation id', () => {
    expect(
      mapExchangeToNewSession(
        { id: 'e1', conversationId: 'old', role: 'user' },
        'new',
      ),
    ).toEqual({ id: 'e1', conversationId: 'new', role: 'user' });
  });
});
