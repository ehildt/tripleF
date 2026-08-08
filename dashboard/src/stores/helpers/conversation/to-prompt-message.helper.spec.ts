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

  it('flattens assistant content that holds raw response JSON', () => {
    const exchange = {
      id: 'ex-6',
      role: 'assistant',
      content: JSON.stringify({
        title: 'Legacy article',
        sectionContent: 'Persisted before harnessData existed.',
      }),
      harnessTemplate: 'article',
      status: 'done',
      timestamp: 6,
    } as const;

    const result = toPromptMessage(exchange as any);
    expect(result.content).toContain('Title: Legacy article');
    expect(result.content).toContain('Persisted before harnessData existed.');
    expect(result.content).not.toContain('{');
  });

  it('drops assistant content that looks like corrupted response JSON', () => {
    const exchange = {
      id: 'ex-7',
      role: 'assistant',
      content: '{"title": "Truncated", "sectionContent": "unterminated',
      status: 'done',
      timestamp: 7,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'assistant',
      content: '',
    });
  });

  it('keeps non-JSON assistant content as-is', () => {
    const exchange = {
      id: 'ex-8',
      role: 'assistant',
      content: 'Some error text',
      status: 'done',
      timestamp: 8,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'assistant',
      content: 'Some error text',
    });
  });

  it('appends attached image names to user turns', () => {
    const exchange = {
      id: 'ex-9',
      role: 'user',
      content: 'What is this?',
      images: [{ name: 'photo.png', hash: 'abc' }],
      status: 'done',
      timestamp: 9,
    } as const;

    expect(toPromptMessage(exchange as any)).toEqual({
      role: 'user',
      content: 'What is this?\n\n[Attached images: photo.png]',
    });
  });

  it('prefixes structured assistant answers with their template marker', () => {
    const exchange = {
      id: 'ex-10',
      role: 'assistant',
      content: '',
      status: 'done',
      timestamp: 10,
      harnessTemplate: 'product',
      harnessData: {
        category: 'Tech',
        title: 'Sony WH-1000XM5',
        shopOffers: [
          { title: 'WH-1000XM5', price: '€289', source: 'MediaMarkt' },
        ],
      },
    } as const;

    const result = toPromptMessage(exchange as any);
    expect(result.content.startsWith('[Template: product]\n')).toBe(true);
    expect(result.content).toContain('Sony WH-1000XM5');
  });

  it('omits the template marker for assistant answers without a harness template', () => {
    const exchange = {
      id: 'ex-11',
      role: 'assistant',
      content: '',
      text: 'plain chat answer',
      status: 'done',
      timestamp: 11,
    } as const;

    expect(toPromptMessage(exchange as any).content).toBe('plain chat answer');
  });

  it('never marks the free-form text template', () => {
    const exchange = {
      id: 'ex-12',
      role: 'assistant',
      content: 'fallback',
      text: 'plain chat answer',
      harnessTemplate: 'text',
      status: 'done',
      timestamp: 12,
    } as const;

    expect(toPromptMessage(exchange as any).content).toBe('plain chat answer');
  });

  it('omits the marker when includeTemplateMarker is false', () => {
    const exchange = {
      id: 'ex-13',
      role: 'assistant',
      content: 'fallback',
      text: 'real text',
      harnessTemplate: 'article',
      status: 'done',
      timestamp: 13,
    } as const;

    const result = toPromptMessage(exchange as any, {
      includeTemplateMarker: false,
    });
    expect(result.content).toBe('real text');
  });
});
