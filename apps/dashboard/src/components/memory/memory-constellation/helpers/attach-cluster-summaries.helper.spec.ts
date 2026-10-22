import { describe, expect, it } from 'vitest';

import type { ConstellationCluster } from '../MemoryConstellation.types';
import { attachClusterSummaries } from './attach-cluster-summaries.helper';

const clusters: ConstellationCluster[] = [
  {
    key: 'gc-1',
    label: 'gc-1',
    color: '#c00',
    memberTopicKeys: [],
    memberCommunityKeys: [],
    memberIds: [],
  },
  {
    key: 'gc-2',
    label: 'gc-2',
    color: '#0c0',
    memberTopicKeys: [],
    memberCommunityKeys: [],
    memberIds: [],
  },
];

describe('attachClusterSummaries', () => {
  it('returns the clusters unchanged when the server sent no summaries', () => {
    expect(attachClusterSummaries(clusters, [])).toEqual(clusters);
  });

  it('overrides title and summary on the matching cluster only', () => {
    const attached = attachClusterSummaries(clusters, [
      { id: 'gc-1', title: 'Games', summary: 'All about games', memberIds: [] },
    ]);
    expect(attached[0].title).toBe('Games');
    expect(attached[0].summary).toBe('All about games');
    expect(attached[1].title).toBeUndefined();
  });
});
