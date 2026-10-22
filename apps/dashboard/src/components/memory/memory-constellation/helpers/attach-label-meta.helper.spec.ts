import { describe, expect, it } from 'vitest';

import type {
  ConstellationLabelMeta,
  PreparedConstellation,
} from '../MemoryConstellation.types';
import { attachLabelMeta } from './attach-label-meta.helper';

function prepared(
  nodeList: PreparedConstellation['nodeList'],
): PreparedConstellation {
  return { nodeList } as PreparedConstellation;
}

describe('attachLabelMeta', () => {
  it('returns the constellation unchanged when no registry metadata exists', () => {
    const input = prepared([]);
    expect(attachLabelMeta(input, undefined)).toBe(input);
    expect(attachLabelMeta(input, new Map())).toBe(input);
  });

  it('merges icon and extra meta rows onto matching hub dots', () => {
    const input = prepared([
      {
        id: 'cluster:games',
        label: 'games',
        topicKey: 't',
        text: 't',
        keys: [],
        summary: 'old',
        meta: [{ label: 'cluster', value: 'games' }],
      } as never,
    ]);
    const meta = new Map<string, ConstellationLabelMeta>([
      [
        'cluster:games',
        {
          icon: 'gamepad',
          summary: 'Video games',
          meta: [{ label: 'leaves', value: '12' }],
        },
      ],
    ]);

    const output = attachLabelMeta(input, meta);
    expect(output.nodeList[0].icon).toBe('gamepad');
    expect(output.nodeList[0].summary).toBe('Video games');
    expect(output.nodeList[0].meta).toEqual([
      { label: 'cluster', value: 'games' },
      { label: 'leaves', value: '12' },
    ]);
  });

  it('leaves non-matching dots unchanged', () => {
    const input = prepared([{ id: 'topic:other', keys: [] } as never]);
    const output = attachLabelMeta(
      input,
      new Map([['cluster:games', { icon: 'gamepad' }]]),
    );
    expect(output.nodeList[0]).toEqual({ id: 'topic:other', keys: [] });
  });
});
