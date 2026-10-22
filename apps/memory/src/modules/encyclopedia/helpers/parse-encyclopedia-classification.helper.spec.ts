import { describe, expect, it } from 'vitest';

import { parseEncyclopediaClassification } from './parse-encyclopedia-classification.helper.js';

describe('parseEncyclopediaClassification', () => {
  it('parses and normalizes a valid classification', () => {
    expect(
      parseEncyclopediaClassification(
        JSON.stringify({
          category: 'Games',
          community: 'Soulslikes',
          topic: '  Wuthering   Waves ',
          node: 'Character   Builds',
        }),
      ),
    ).toEqual({
      category: 'games',
      community: 'soulslikes',
      topic: 'wuthering waves',
      node: 'character builds',
    });
  });

  it('tolerates markdown fences around the JSON', () => {
    expect(
      parseEncyclopediaClassification(
        '```json\n{"category":"work","community":"finance","topic":"q3 budget","node":"department spend"}\n```',
      ),
    ).toEqual({
      category: 'work',
      community: 'finance',
      topic: 'q3 budget',
      node: 'department spend',
    });
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
        JSON.stringify({
          category: '   ',
          community: 'x',
          topic: 'y',
          node: 'z',
        }),
      ),
    ).toThrow(/empty category or topic/);
  });

  it('throws when normalization loses a deep-chain label (strict chain)', () => {
    expect(() =>
      parseEncyclopediaClassification(
        JSON.stringify({
          category: 'work',
          community: 'finance',
          topic: 'q3 budget',
          node: 'x'.repeat(200),
        }),
      ),
    ).toThrow(/taxonomy chain/);
  });
});
