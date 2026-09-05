import { describe, expect, it } from 'vitest';

import { classifyStaleConvictions } from './classify-stale-convictions.helper.js';

describe('classifyStaleConvictions', () => {
  it('marks a statement stale when evidence is missing', () => {
    const result = classifyStaleConvictions(
      [{ id: 'conviction-1', evidenceIds: ['a', 'b'] }],
      [{ id: 'b', superseded: false }],
    );
    expect(result.staleConvictionIds).toEqual(['conviction-1']);
    expect(result.reofferIds).toEqual(['b']);
  });

  it('marks a statement stale when evidence is superseded', () => {
    const result = classifyStaleConvictions(
      [{ id: 'conviction-1', evidenceIds: ['a', 'b'] }],
      [
        { id: 'a', superseded: true },
        { id: 'b', superseded: false },
      ],
    );
    expect(result.staleConvictionIds).toEqual(['conviction-1']);
    expect(result.reofferIds).toEqual(['b']);
  });

  it('leaves a healthy statement untouched', () => {
    const result = classifyStaleConvictions(
      [{ id: 'conviction-1', evidenceIds: ['a', 'b'] }],
      [
        { id: 'a', superseded: false },
        { id: 'b', superseded: false },
      ],
    );
    expect(result.staleConvictionIds).toEqual([]);
    expect(result.reofferIds).toEqual([]);
  });

  it('re-offers only surviving evidence across multiple stale statements', () => {
    const result = classifyStaleConvictions(
      [
        { id: 'conviction-1', evidenceIds: ['a', 'b'] },
        { id: 'conviction-2', evidenceIds: ['c', 'd'] },
      ],
      [
        { id: 'a', superseded: true },
        { id: 'b', superseded: false },
        { id: 'c', superseded: false },
        // 'd' is missing from the retrieve result.
      ],
    );
    expect(result.staleConvictionIds).toEqual(['conviction-1', 'conviction-2']);
    expect(result.reofferIds).toEqual(['b', 'c']);
  });
});
