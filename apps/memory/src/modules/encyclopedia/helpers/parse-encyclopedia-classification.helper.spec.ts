import { describe, expect, it } from 'vitest';

import { parseEncyclopediaClassification } from './parse-encyclopedia-classification.helper.js';

describe('parseEncyclopediaClassification', () => {
  it('parses and normalizes a valid classification', () => {
    expect(
      parseEncyclopediaClassification(
        JSON.stringify({ category: 'Games', topic: '  Wuthering   Waves ' }),
      ),
    ).toEqual({ category: 'games', topic: 'wuthering waves' });
  });

  it('tolerates markdown fences around the JSON', () => {
    expect(
      parseEncyclopediaClassification(
        '```json\n{"category":"work","topic":"q3 budget"}\n```',
      ),
    ).toEqual({ category: 'work', topic: 'q3 budget' });
  });

  it('throws on empty output', () => {
    expect(() => parseEncyclopediaClassification('  ')).toThrow(
      'Classification returned empty output',
    );
  });

  it('throws on unparseable JSON', () => {
    expect(() => parseEncyclopediaClassification('not json')).toThrow(
      /JSON parse failed/,
    );
  });

  it('throws on a schema violation', () => {
    expect(() =>
      parseEncyclopediaClassification(
        JSON.stringify({ category: 42, topic: 'x' }),
      ),
    ).toThrow(/failed the schema/);
  });

  it('throws when normalization yields an empty category or topic', () => {
    expect(() =>
      parseEncyclopediaClassification(
        JSON.stringify({ category: '   ', topic: 'x' }),
      ),
    ).toThrow(/empty category or topic/);
  });
});
