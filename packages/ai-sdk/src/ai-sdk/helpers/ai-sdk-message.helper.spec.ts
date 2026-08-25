import { describe, expect, it } from 'vitest';

import { toAiSdkMessages } from './ai-sdk-message.helper.ts';

describe('toAiSdkMessages', () => {
  it('returns undefined system when no system messages exist', () => {
    const { system, messages } = toAiSdkMessages([{ role: 'user', content: 'hello' }]);

    expect(system).toBeUndefined();
    expect(messages).toEqual([{ role: 'user', content: 'hello' }]);
  });

  it('joins multiple system messages with blank lines', () => {
    const { system } = toAiSdkMessages([
      { role: 'system', content: 'First instruction' },
      { role: 'system', content: 'Second instruction' },
      { role: 'user', content: 'hello' },
    ]);

    expect(system).toBe('First instruction\n\nSecond instruction');
  });

  it('excludes system messages from the converted message list', () => {
    const { messages } = toAiSdkMessages([
      { role: 'system', content: 'system prompt' },
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);

    expect(messages).toEqual([
      { role: 'user', content: 'hello' },
      { role: 'assistant', content: 'hi' },
    ]);
  });
});
