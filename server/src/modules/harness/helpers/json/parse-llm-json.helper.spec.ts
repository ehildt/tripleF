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

  it('tolerates literal newlines inside double-quoted string values', () => {
    // Simulates an LLM that outputs actual newline chars inside a JSON string
    const input = `{"lead": "First paragraph\n\nSecond paragraph","title": "Header"}`;
    const result = parseLlmJson(input);
    expect(result).toEqual({
      lead: 'First paragraph\n\nSecond paragraph',
      title: 'Header',
    });
  });

  it('tolerates literal tabs inside double-quoted string values', () => {
    const input = `{"body": "col1\tcol2\tcol3","id": 1}`;
    const result = parseLlmJson(input);
    expect(result).toEqual({
      body: 'col1\tcol2\tcol3',
      id: 1,
    });
  });

  it('preserves existing escape sequences while fixing literal controls', () => {
    // String already has proper JSON \n escape — should stay correct
    const input = '{"a": "line1\\nline2","b": "value with\nliteral newline"}';
    const result = parseLlmJson(input);
    expect(result).toEqual({
      a: 'line1\nline2',
      b: 'value with\nliteral newline',
    });
  });

  it('handles multi-line string values like an LLM news lead', () => {
    const input = `{
  "category": "Tech",
  "lead": "Recent leaks have surfaced.\nAdditionally, AMD confirmed the roadmap.",
  "sectionTitle": "AMD CPU Leaks"
}`;
    const result = parseLlmJson(input);
    expect(result).toEqual({
      category: 'Tech',
      lead: 'Recent leaks have surfaced.\nAdditionally, AMD confirmed the roadmap.',
      sectionTitle: 'AMD CPU Leaks',
    });
  });

  it('escapes other non-printable control characters inside quoted strings', () => {
    // Bell character (0x07) inside a quoted value
    const input = `{"msg": "alert\\u0007here", "ok": 1}`;
    const result = parseLlmJson(input);
    expect(result).toEqual({ msg: 'alert\u0007here', ok: 1 });
  });
});
