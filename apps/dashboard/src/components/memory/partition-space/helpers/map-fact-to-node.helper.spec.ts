import { describe, expect, it } from 'vitest';

import { mapFactToNode } from './map-fact-to-node.helper';

describe('mapFactToNode', () => {
  it('maps a fact to a constellation node', () => {
    const node = mapFactToNode({
      id: 'f1',
      text: 'likes games',
      tags: ['games'],
      role: 'user',
      category: 'Games',
      createdAt: '2025-01-01',
    });
    expect(node.id).toBe('f1');
    expect(node.topicKey).toBe('games');
    expect(node.clusterKey).toBe('Games');
    expect(node.meta).toEqual([
      { label: 'role', value: 'user' },
      { label: 'category', value: 'Games' },
      { label: 'created', value: '2025-01-01' },
    ]);
  });

  it('surfaces the classified maintenance metadata', () => {
    const node = mapFactToNode({
      id: 'f1',
      text: 'likes games',
      role: 'user',
      category: 'games',
      subject: 'user',
      kind: 'preference',
      stability: 'durable',
    });
    expect(node.meta).toEqual([
      { label: 'role', value: 'user' },
      { label: 'subject', value: 'user' },
      { label: 'category', value: 'games' },
      { label: 'kind', value: 'preference' },
      { label: 'stability', value: 'durable' },
    ]);
  });

  it('groups by the classified subject before the first tag', () => {
    // The topic tier is the title-level entity: the extraction-classified
    // subject wins over tag order (LLM luck), so all records of one title
    // land under one topic no matter which tag the extractor led with.
    const node = mapFactToNode({
      id: 'f1',
      text: 'Stellar Blade sold over 6.1 million units.',
      subject: 'stellar blade',
      tags: ['rpg', 'stellar blade', 'gacha'],
      category: 'games',
    });
    expect(node.topicKey).toBe('stellar blade');
    expect(node.label).toBe('stellar blade');
    expect(node.keys).toEqual(['rpg', 'stellar blade', 'gacha']);
  });

  it('falls back to the untagged topic', () => {
    expect(mapFactToNode({ id: 'f1', text: 'hello' }).topicKey).toBe(
      'untagged',
    );
  });

  it('maps a bridge to a distinct bridge node', () => {
    const node = mapFactToNode({
      id: 'b1',
      text: 'The user is migrating to Rust',
      tags: ['bridge'],
      role: 'assistant',
      evidenceIds: ['a', 'b'],
    });
    expect(node.isBridge).toBe(true);
    expect(node.topicKey).toBe('bridges');
    expect(node.label).toBe('bridge');
    expect(node.keys).toEqual([]);
  });

  it('resolves bridge evidence ids to text', () => {
    const node = mapFactToNode(
      {
        id: 'b1',
        text: 'The user is migrating to Rust',
        tags: ['bridge'],
        evidenceIds: ['a', 'b'],
      },
      new Map([
        ['a', 'I am learning Rust'],
        ['b', 'I am rewriting the payments service'],
      ]),
    );
    expect(node.evidenceTexts).toEqual([
      'I am learning Rust',
      'I am rewriting the payments service',
    ]);
  });

  it('falls back to the raw id when evidence text is unknown', () => {
    const node = mapFactToNode(
      { id: 'b1', text: 'bridge', tags: ['bridge'], evidenceIds: ['missing'] },
      new Map(),
    );
    expect(node.evidenceTexts).toEqual(['missing']);
  });
});
