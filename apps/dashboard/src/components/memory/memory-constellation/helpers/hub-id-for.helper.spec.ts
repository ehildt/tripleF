import { describe, expect, it } from 'vitest';

import { hubIdFor } from './hub-id-for.helper';

const topic = {
  key: 'work',
  label: 'work',
  color: '#000',
  memberIds: ['a', 'b'],
};

describe('hubIdFor', () => {
  it('returns the first member for an expanded topic', () => {
    expect(hubIdFor(topic, new Set())).toBe('a');
  });

  it('returns the synthetic category dot id for a collapsed multi-member topic', () => {
    expect(hubIdFor(topic, new Set(['work']))).toBe('topic:work');
  });

  it('returns the member for a collapsed single-member topic', () => {
    const single = { ...topic, memberIds: ['a'] };
    expect(hubIdFor(single, new Set(['work']))).toBe('a');
  });
});
