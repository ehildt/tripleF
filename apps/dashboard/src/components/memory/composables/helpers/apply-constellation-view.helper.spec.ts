import { describe, expect, it } from 'vitest';

import type { ConstellationNode } from '../../memory-constellation/MemoryConstellation.types';
import { applyConstellationView } from './apply-constellation-view.helper';

const makeNode = (overrides: Partial<ConstellationNode>): ConstellationNode =>
  ({
    id: 'n',
    label: 'n',
    topicKey: 'c',
    text: 't',
    keys: [],
    ...overrides,
  }) as ConstellationNode;

describe('applyConstellationView', () => {
  it('keeps bridges visible in strict mode (curated by construction)', () => {
    const nodes = [
      makeNode({ id: 'b1', isBridge: true }),
      // Consolidated but unlinked — the partition strict gate hides it.
      makeNode({ id: 'f1', isConsolidated: true }),
    ];

    const result = applyConstellationView(nodes, [], true, 'partition');

    expect(result.nodes.map((node) => node.id)).toEqual(['b1']);
  });

  it('hides superseded bridges in strict mode', () => {
    const nodes = [makeNode({ id: 'b1', isBridge: true, superseded: true })];

    const result = applyConstellationView(nodes, [], true, 'partition');

    expect(result.nodes).toEqual([]);
  });

  it('keeps non-superseded bridges visible in recommended mode', () => {
    const nodes = [makeNode({ id: 'b1', isBridge: true })];

    const result = applyConstellationView(nodes, [], false, 'partition');

    expect(result.nodes.map((node) => node.id)).toEqual(['b1']);
  });
});
