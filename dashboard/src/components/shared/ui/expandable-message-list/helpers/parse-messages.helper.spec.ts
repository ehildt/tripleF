import { describe, expect, it } from 'vitest';

import type { MessageListItem } from '../types';
import { parseMessages } from './parse-messages.helper';

describe('parseMessages', () => {
  it('returns an empty array for nullish input', () => {
    expect(parseMessages(null)).toEqual([]);
    expect(parseMessages(undefined)).toEqual([]);
  });

  it('returns arrays unchanged', () => {
    const messages: MessageListItem[] = [{ role: 'user', content: 'hi' }];
    expect(parseMessages(messages)).toBe(messages);
  });

  it('extracts content from an object wrapper', () => {
    const messages: MessageListItem[] = [{ role: 'user', content: 'hi' }];
    expect(parseMessages({ content: messages })).toBe(messages);
  });

  it('parses a JSON string array', () => {
    expect(parseMessages('[{"role":"user","content":"hi"}]')).toEqual([
      { role: 'user', content: 'hi' },
    ]);
  });

  it('parses a JSON string object with content array', () => {
    expect(
      parseMessages('{"content":[{"role":"user","content":"hi"}]}'),
    ).toEqual([{ role: 'user', content: 'hi' }]);
  });

  it('returns an empty array for unparsable strings', () => {
    expect(parseMessages('plain text')).toEqual([]);
  });
});
