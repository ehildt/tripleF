import { describe, expect, it } from 'vitest';

import type {
  ConstellationFriction,
  ConstellationNode,
} from '../../../memory-constellation/MemoryConstellation.types';
import { mapNodeToFrictions } from './map-node-to-frictions.helper';

const node = {
  id: 'a',
  label: 'a',
  topicKey: 'x',
  text: 'a',
  keys: ['x'],
} satisfies ConstellationNode;

const frictions: ConstellationFriction[] = [
  { source: 'a', target: 'b', reason: 'source-side conflict' },
  { source: 'c', target: 'a', reason: 'target-side conflict' },
  { source: 'd', target: 'e', reason: 'unrelated conflict' },
];

describe('mapNodeToFrictions', () => {
  it('returns frictions where the node is the source OR the target', () => {
    expect(mapNodeToFrictions(node, frictions)).toEqual([
      { source: 'a', target: 'b', reason: 'source-side conflict' },
      { source: 'c', target: 'a', reason: 'target-side conflict' },
    ]);
  });

  it('returns an empty list for no node or no frictions', () => {
    expect(mapNodeToFrictions(null, frictions)).toEqual([]);
    expect(mapNodeToFrictions(node, [])).toEqual([]);
  });
});
