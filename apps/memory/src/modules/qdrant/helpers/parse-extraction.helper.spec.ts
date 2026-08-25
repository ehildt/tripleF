import { describe, expect, it } from 'vitest';

import { parseExtraction } from './parse-extraction.helper.js';

describe('parseExtraction', () => {
  it('parses a well-formed response and normalizes it', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          facts: [' User prefers concise. ', 'User prefers concise.', ' '],
          tags: ['Work', 'Rust', 'work'],
          category: 'Work',
        }),
      ),
    ).toEqual({
      facts: ['User prefers concise.'],
      tags: ['work', 'rust'],
      category: 'work',
    });
  });

  it('normalizes the category to its canonical family label', () => {
    expect(
      parseExtraction(
        JSON.stringify({ facts: ['F1'], tags: ['work'], category: 'PDF' }),
      ),
    ).toEqual({ facts: ['F1'], tags: ['work'], category: 'pdf' });
  });

  it('omits the category when absent', () => {
    expect(
      parseExtraction(JSON.stringify({ facts: ['F1'], tags: ['work'] })),
    ).toEqual({ facts: ['F1'], tags: ['work'], category: undefined });
  });

  it('tolerates markdown fences around the JSON', () => {
    expect(
      parseExtraction('```json\n{"facts":["F1"],"tags":["work"]}\n```'),
    ).toEqual({ facts: ['F1'], tags: ['work'] });
  });

  it('tolerates single-quoted JSON5 output', () => {
    expect(parseExtraction("{'facts': ['F1'], 'tags': ['work']}")).toEqual({
      facts: ['F1'],
      tags: ['work'],
    });
  });

  it('throws on empty output', () => {
    expect(() => parseExtraction('  ')).toThrow('empty output');
  });

  it('throws a descriptive error on schema violation', () => {
    expect(() => parseExtraction('{"facts": "not-an-array"}')).toThrow(
      'failed the schema',
    );
  });

  it('drops overlong tags and caps at 8 tags', () => {
    const tags = [
      'x'.repeat(41),
      ...Array.from({ length: 12 }, (_, i) => `t${i}`),
    ];
    const result = parseExtraction(JSON.stringify({ facts: [], tags }));
    expect(result.tags).toEqual(Array.from({ length: 8 }, (_, i) => `t${i}`));
  });
});
