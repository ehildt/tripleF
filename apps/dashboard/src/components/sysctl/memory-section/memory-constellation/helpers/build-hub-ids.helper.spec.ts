import { describe, expect, it } from 'vitest';

import { buildHubIds } from './build-hub-ids.helper';
import { ROOT_NODE_ID } from './root-node-id.constant';

describe('buildHubIds', () => {
  it('uses the first member for expanded clusters and the category dot for collapsed ones', () => {
    const hubIds = buildHubIds(
      [
        { key: 'x', label: 'x', color: '#000', memberIds: ['a', 'b'] },
        { key: 'y', label: 'y', color: '#000', memberIds: ['c'] },
      ],
      new Set(['y']),
    );

    expect(hubIds).toEqual(new Set(['a', 'cluster:y', ROOT_NODE_ID]));
  });

  it('still includes the ZERO root for empty clusters', () => {
    const hubIds = buildHubIds(
      [{ key: 'x', label: 'x', color: '#000', memberIds: [] }],
      new Set(),
    );

    expect(hubIds).toEqual(new Set([ROOT_NODE_ID]));
  });

  it('includes every community hub', () => {
    const hubIds = buildHubIds(
      [{ key: 'x', label: 'x', color: '#000', memberIds: ['a'] }],
      new Set(),
      [
        {
          key: 'games',
          label: 'games',
          color: '#f97316',
          memberClusterKeys: ['x'],
          memberIds: ['a'],
        },
      ],
    );

    expect(hubIds.has('community:games')).toBe(true);
  });
});
