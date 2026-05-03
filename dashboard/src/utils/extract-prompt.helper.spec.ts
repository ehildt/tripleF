import { describe, expect, it } from 'vitest';

import { extractPrompt } from './extract-prompt.helper';

describe('extractPrompt', () => {
  it('returns undefined with no inputs', () => {
    expect(extractPrompt(undefined)).toBeUndefined();
  });

  it('extracts prompt from form data', () => {
    const fd = new FormData();
    fd.append('prompt', 'hello');
    expect(extractPrompt(fd)).toBe('hello');
  });

  it('extracts prompt from payload form data', () => {
    const fd = new FormData();
    fd.append(
      'payload',
      JSON.stringify({ params: { arguments: { prompt: 'world' } } }),
    );
    expect(extractPrompt(fd)).toBe('"world"');
  });

  it('extracts prompt from body', () => {
    const body = JSON.stringify({ params: { arguments: { prompt: 'body' } } });
    expect(extractPrompt(undefined, body)).toBe('"body"');
  });

  it('returns undefined when prompt not found', () => {
    const fd = new FormData();
    fd.append('payload', '{}');
    expect(extractPrompt(fd)).toBeUndefined();
  });
});
