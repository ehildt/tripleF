import { describe, expect, it } from 'vitest';

import { extractResponseText } from './extract-response-text.helper';

describe('extractResponseText', () => {
  it('returns an empty string for empty input', () => {
    expect(extractResponseText('')).toBe('');
    expect(extractResponseText('   ')).toBe('');
  });

  it('returns plain text unchanged', () => {
    expect(extractResponseText('just a sentence')).toBe('just a sentence');
  });

  it('extracts the text field from a JSON object', () => {
    expect(extractResponseText('{"text": "the answer"}')).toBe('the answer');
  });

  it('extracts text from a fenced JSON object', () => {
    expect(extractResponseText('```json\n{"text": "fenced"}\n```')).toBe(
      'fenced',
    );
  });
});
