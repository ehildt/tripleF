import { describe, expect, it } from 'vitest';

import { mapExchangeToMessage } from './map-exchange-to-message.helper';

describe('mapExchangeToMessage', () => {
  it('converts an exchange into a turndown message', () => {
    const result = mapExchangeToMessage(
      {
        id: 'e1',
        role: 'user',
        content: '<p>hello</p>',
        status: 'done',
        timestamp: 1,
      },
      { turndown: (html: string) => html.replace(/<[^<>]*>/g, '') },
    );
    expect(result.role).toBe('user');
    expect(result.content).toContain('hello');
  });
});
