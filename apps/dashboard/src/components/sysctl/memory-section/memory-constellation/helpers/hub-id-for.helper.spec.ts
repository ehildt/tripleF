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

  it('returns the synthetic category dot id for a collapsed multi-member cluster', () => {
    expect(hubIdFor(cluster, new Set(['work']))).toBe('cluster:work');
  });

  it('returns the member for a collapsed single-member cluster', () => {
    const single = { ...cluster, memberIds: ['a'] };
    expect(hubIdFor(single, new Set(['work']))).toBe('a');
  });
});
