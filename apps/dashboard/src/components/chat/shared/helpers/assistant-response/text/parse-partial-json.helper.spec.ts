import { describe, expect, it } from 'vitest';

import { parsePartialJson } from './parse-partial-json.helper';

describe('parsePartialJson', () => {
  it('returns null for empty input', () => {
    expect(parsePartialJson('')).toBeNull();
    expect(parsePartialJson('   ')).toBeNull();
  });

  it('parses complete JSON', () => {
    expect(parsePartialJson('{"a": 1}')).toEqual({ a: 1 });
  });

  it('parses partial JSON through the lenient parser', () => {
    expect(parsePartialJson('{"a": 1, "b":')).toEqual({ a: 1 });
  });

  it('returns null for garbage', () => {
    expect(parsePartialJson('not json at all {{{')).toBeNull();
  });
});
