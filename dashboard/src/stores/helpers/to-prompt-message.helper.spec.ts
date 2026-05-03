import { describe, expect, it } from 'vitest';

import { toPromptMessage } from './to-prompt-message.helper';

describe('toPromptMessage', () => {
  it('returns role and content for a user exchange', () => {
    const exchange = {
      id: 'ex-1',
      role: 'user',
      content: 'Hello',
      status: 'done',
      timestamp: 1,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'user',
      content: 'Hello',
    });
  });

  it('uses plain text field for an assistant exchange when available', () => {
    const exchange = {
      id: 'ex-2',
      role: 'assistant',
      content: '<p>Hi there</p>',
      text: 'Plain text answer',
      status: 'done',
      timestamp: 2,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'assistant',
      content: 'Plain text answer',
    });
  });

  it('serializes harness data for an assistant exchange when text is missing', () => {
    const exchange = {
      id: 'ex-3',
      role: 'assistant',
      content: 'summary text',
      status: 'done',
      timestamp: 3,
      harnessTemplate: 'article',
      harnessData: {
        category: 'Gaming',
        title: 'Neverness to Everness',
        sectionContent: 'An open-world RPG.',
      },
      model: 'llama3',
    } as const;

    const result = toPromptMessage(exchange as any);
    expect(result.role).toBe('assistant');
    expect(result.content).toContain('Title: Neverness to Everness');
    expect(result.content).toContain('An open-world RPG.');
  });

  it('prefers text over harness data for assistant exchanges', () => {
    const exchange = {
      id: 'ex-4',
      role: 'assistant',
      content: 'fallback',
      text: 'real text',
      harnessData: { title: 'Title' },
      status: 'done',
    } as const;

    expect(toPromptMessage(exchange as any).content).toBe('real text');
  });

  it('falls back to empty string when content is not a string', () => {
    const exchange = {
      id: 'ex-5',
      role: 'user',
      content: undefined,
      status: 'done',
      timestamp: 5,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'user',
      content: '',
    });
  });
});
