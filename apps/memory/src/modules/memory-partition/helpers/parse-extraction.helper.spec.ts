import { describe, expect, it } from 'vitest';

import { parseExtraction } from './parse-extraction.helper.js';

const fact = {
  text: 'Sam works on the memory app.',
  subject: 'sam',
  node: 'memory app',
  category: 'work',
  community: 'collaboration',
  kind: 'project',
  stability: 'durable',
};

describe('parseExtraction', () => {
  it('parses a well-formed response and normalizes it', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          remember: true,
          facts: [
            {
              ...fact,
              text: ' Sam works on the memory app. ',
              subject: ' Sam ',
            },
            fact,
            { ...fact, text: ' ' },
          ],
          tags: ['Work', 'Rust', 'work'],
          category: 'Work',
        }),
      ),
    ).toEqual({
      remember: true,
      facts: [{ ...fact, subject: 'sam' }],
      tags: ['work', 'rust'],
      category: 'work',
    });
  });

  it('normalizes the per-fact category to its canonical family label', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          remember: true,
          facts: [{ ...fact, text: 'F1', category: 'PDF' }],
          tags: ['work'],
          category: 'PDF',
        }),
      ),
    ).toEqual({
      remember: true,
      facts: [{ ...fact, text: 'F1', category: 'pdf' }],
      tags: ['work'],
      category: 'pdf',
    });
  });

  it('rejects a fact missing a chain label (strict taxonomy chain)', () => {
    const incomplete = { ...fact, node: undefined };
    expect(() =>
      parseExtraction(
        JSON.stringify({ remember: true, facts: [incomplete], tags: ['work'] }),
      ),
    ).toThrow('failed the schema');
  });

  it('tolerates markdown fences around the JSON', () => {
    expect(
      parseExtraction(
        `\`\`\`json\n${JSON.stringify({ remember: true, facts: [fact], tags: ['work'] })}\n\`\`\``,
      ),
    ).toEqual({ remember: true, facts: [fact], tags: ['work'] });
  });

  it('passes a clean remember=false verdict straight through, dropping nothing else', () => {
    expect(
      parseExtraction(
        JSON.stringify({
          remember: false,
          facts: [],
          tags: [],
          category: 'games',
          community: 'video games',
        }),
      ),
    ).toEqual({ remember: false, facts: [], tags: [] });
  });

  it('rejects an inconsistent verdict: remember=false with facts attached', () => {
    expect(() =>
      parseExtraction(
        JSON.stringify({ remember: false, facts: [fact], tags: [] }),
      ),
    ).toThrow('verdict inconsistent');
  });

  it('rejects an inconsistent verdict: remember=true without facts', () => {
    expect(() =>
      parseExtraction(
        JSON.stringify({ remember: true, facts: [], tags: ['work'] }),
      ),
    ).toThrow('verdict inconsistent');
  });

  it('throws on empty output', () => {
    expect(() => parseExtraction('  ')).toThrow('empty output');
  });

  it('throws a descriptive error on schema violation', () => {
    expect(() =>
      parseExtraction('{"remember": true, "facts": "not-an-array"}'),
    ).toThrow('failed the schema');
  });

  it('rejects the legacy bare-string fact shape', () => {
    expect(() =>
      parseExtraction('{"remember": true, "facts": ["F1"], "tags": ["work"]}'),
    ).toThrow('failed the schema');
  });

  it('requires kind and stability on every fact', () => {
    expect(() =>
      parseExtraction(
        JSON.stringify({
          remember: true,
          facts: [{ text: 'F1' }],
          tags: ['work'],
        }),
      ),
    ).toThrow('failed the schema');
  });

  it('drops overlong tags and caps at 8 tags', () => {
    const tags = [
      'x'.repeat(41),
      ...Array.from({ length: 12 }, (_, i) => `t${i}`),
    ];
    const result = parseExtraction(
      JSON.stringify({ remember: true, facts: [fact], tags }),
    );
    expect(result.tags).toEqual(Array.from({ length: 8 }, (_, i) => `t${i}`));
  });
});
