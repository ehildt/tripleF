import { describe, expect, it } from 'vitest';

import { extractHarnessText } from './extract-harness-text.helper';

describe('extractHarnessText', () => {
  it('returns an empty string for empty input', () => {
    expect(extractHarnessText('')).toBe('');
  });

  it('extracts text from a complete JSON object', () => {
    expect(extractHarnessText('{ "text": "Hello world" }')).toBe('Hello world');
  });

  it('extracts text from partial JSON', () => {
    expect(extractHarnessText('{ "text": "Hello')).toBe('Hello');
  });

  it('strips markdown fences before extracting', () => {
    expect(extractHarnessText('```json\n{ "text": "Fenced" }\n```')).toBe(
      'Fenced',
    );
  });

  it('falls back to the raw delta when JSON has no text field', () => {
    expect(extractHarnessText('plain text response')).toBe(
      'plain text response',
    );
  });

  it('falls back to the raw delta for invalid JSON', () => {
    expect(extractHarnessText('not { valid json')).toBe('not { valid json');
  });
});
