import { describe, expect, it } from 'vitest';

import { parsePartialJson } from './parse-partial-json.helper';

describe('parsePartialJson', () => {
  it('parses complete JSON', () => {
    expect(parsePartialJson('{"title":"Hello"}')).toEqual({ title: 'Hello' });
  });

  it('parses partial strings', () => {
    expect(parsePartialJson('{"title":"Hel')).toEqual({ title: 'Hel' });
  });

  it('parses partial arrays', () => {
    expect(parsePartialJson('{"title":"Hello", "keyFindings":[')).toEqual({
      title: 'Hello',
      keyFindings: [],
    });
  });

  it('returns null for empty or invalid input', () => {
    expect(parsePartialJson('')).toBeNull();
    expect(parsePartialJson('   ')).toBeNull();
    expect(parsePartialJson('not json')).toBeNull();
  });
});
