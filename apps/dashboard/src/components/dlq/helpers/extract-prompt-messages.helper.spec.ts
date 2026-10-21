import { describe, expect, it } from 'vitest';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { extractPromptMessages } from './extract-prompt-messages.helper';

const makeEntry = (payload: DlqEntry['payload']): DlqEntry =>
  ({ payload }) as DlqEntry;

describe('extractPromptMessages', () => {
  it('returns an empty list for a missing entry or payload', () => {
    expect(extractPromptMessages(undefined)).toEqual([]);
    expect(extractPromptMessages(makeEntry(null))).toEqual([]);
  });

  it('returns an empty list when the prompt is absent', () => {
    expect(extractPromptMessages(makeEntry({ filters: {} }))).toEqual([]);
  });

  it('returns a prompt stored as a message array as-is', () => {
    const prompt = [
      { role: 'system', content: 'sys' },
      { role: 'user', content: 'hi' },
    ];
    const entry = makeEntry({ filters: { prompt } });
    expect(extractPromptMessages(entry)).toEqual(prompt);
  });

  it('unwraps a prompt stored as an object with a content list', () => {
    const prompt = { content: [{ role: 'user', content: 'hi' }] };
    const entry = makeEntry({ filters: { prompt } });
    expect(extractPromptMessages(entry)).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });

  it('parses a prompt stored as a JSON string', () => {
    const prompt = JSON.stringify([{ role: 'user', content: 'hi' }]);
    const entry = makeEntry({ filters: { prompt } });
    expect(extractPromptMessages(entry)).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });

  it('returns an empty list for a plain text or broken JSON prompt', () => {
    expect(
      extractPromptMessages(makeEntry({ filters: { prompt: 'just text' } })),
    ).toEqual([]);
    expect(
      extractPromptMessages(makeEntry({ filters: { prompt: '[{broken' } })),
    ).toEqual([]);
  });

  it('returns an empty list for a prompt shape that is neither list nor content-holder', () => {
    const entry = makeEntry({ filters: { prompt: { text: 'hi' } } });
    expect(extractPromptMessages(entry)).toEqual([]);
  });
});
