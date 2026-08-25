import { describe, expect, it } from 'vitest';

import { hubIdFor } from './hub-id-for.helper';

const cluster = {
  key: 'work',
  label: 'work',
  color: '#000',
  memberIds: ['a', 'b'],
};

describe('hubIdFor', () => {
  it('returns the first member for an expanded cluster', () => {
    expect(hubIdFor(cluster, new Set())).toBe('a');
  });

  it('returns the synthetic category dot id for a collapsed cluster', () => {
    expect(hubIdFor(cluster, new Set(['work']))).toBe('cluster:work');
  });
});
