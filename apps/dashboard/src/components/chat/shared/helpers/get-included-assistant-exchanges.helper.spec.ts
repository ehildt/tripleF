import { describe, expect, it } from 'vitest';

import { getIncludedAssistantExchanges } from './get-included-assistant-exchanges.helper';

describe('getIncludedAssistantExchanges', () => {
  it('keeps done, included assistants only', () => {
    expect(
      getIncludedAssistantExchanges([
        { role: 'assistant', status: 'done' },
        { role: 'assistant', status: 'done', included: false },
        { role: 'assistant', status: 'pending' },
        { role: 'user', status: 'done' },
      ]),
    ).toHaveLength(1);
  });

  it('returns an empty list when nothing qualifies', () => {
    expect(getIncludedAssistantExchanges([])).toEqual([]);
  });
});
