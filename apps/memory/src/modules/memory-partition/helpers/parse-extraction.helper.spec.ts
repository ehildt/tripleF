import { describe, expect, it } from 'vitest';

import { parseExtraction } from './parse-extraction.helper.js';

const fact = {
  text: 'User prefers concise.',
  kind: 'preference',
  stability: 'durable',
};

describe('parseExtraction', () => {
  it('parses a well-formed response and normalizes it', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          facts: [
            { ...fact, text: ' User prefers concise. ', subject: ' User ' },
            fact,
            { ...fact, text: ' ' },
          ],
          tags: ['Work', 'Rust', 'work'],
          category: 'Work',
        }),
      ),
    ).toEqual({
      facts: [{ ...fact, subject: 'user' }],
      tags: ['work', 'rust'],
      category: 'work',
    });
  });

  it('normalizes the per-fact category to its canonical family label', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          facts: [{ ...fact, text: 'F1', category: 'PDF' }],
          tags: ['work'],
          category: 'PDF',
        }),
      ),
    ).toEqual({
      facts: [{ ...fact, text: 'F1', category: 'pdf' }],
      tags: ['work'],
      category: 'pdf',
    });
  });

  it('omits optional per-fact metadata when absent', () => {
    expect(
      parseExtraction(JSON.stringify({ facts: [fact], tags: ['work'] })),
    ).toEqual({ facts: [fact], tags: ['work'], category: undefined });
  });

  it('tolerates markdown fences around the JSON', () => {
    expect(
      parseExtraction(
        `\`\`\`json\n${JSON.stringify({ facts: [fact], tags: ['work'] })}\n\`\`\``,
      ),
    ).toEqual({ facts: [fact], tags: ['work'] });
  });

  it('throws on empty output', () => {
    expect(() => parseExtraction('  ')).toThrow('empty output');
  });

  it('throws a descriptive error on schema violation', () => {
    expect(() => parseExtraction('{"facts": "not-an-array"}')).toThrow(
      'failed the schema',
    );
  });

  it('rejects the legacy bare-string fact shape', () => {
    expect(() =>
      parseExtraction('{"facts": ["F1"], "tags": ["work"]}'),
    ).toThrow('failed the schema');
  });

  it('requires kind and stability on every fact', () => {
    expect(() =>
      parseExtraction(
        JSON.stringify({ facts: [{ text: 'F1' }], tags: ['work'] }),
      ),
    ).toThrow('failed the schema');
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
