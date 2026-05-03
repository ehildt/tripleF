import { describe, expect, it } from 'vitest';

import { parseLlmJson } from './parse-llm-json.helper.js';

describe('parseLlmJson', () => {
  it('parses strict JSON', () => {
    const result = parseLlmJson('{"a":1,"b":"two"}');
    expect(result).toEqual({ a: 1, b: 'two' });
  });

  it('strips markdown json fences', () => {
    const result = parseLlmJson('```json\n{"a":1}\n```');
    expect(result).toEqual({ a: 1 });
  });

  it('tolerates single quotes around keys and strings', () => {
    const result = parseLlmJson("{ 'text': 'hello' }");
    expect(result).toEqual({ text: 'hello' });
  });

  it('tolerates unquoted object keys', () => {
    const result = parseLlmJson('{ title: "A", sectionContent: "B" }');
    expect(result).toEqual({ title: 'A', sectionContent: 'B' });
  });

  it('tolerates trailing commas', () => {
    const result = parseLlmJson('[1, 2, 3,]');
    expect(result).toEqual([1, 2, 3]);
  });

  it('throws on genuinely invalid content', () => {
    expect(() => parseLlmJson('{ invalid json')).toThrow();
  });

  it('throws on empty content', () => {
    expect(() => parseLlmJson('   ')).toThrow('Response is empty.');
  });
});
