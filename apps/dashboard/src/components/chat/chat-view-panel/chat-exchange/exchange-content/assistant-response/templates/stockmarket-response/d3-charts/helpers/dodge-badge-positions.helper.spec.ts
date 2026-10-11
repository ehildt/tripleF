import { describe, expect, it } from 'vitest';

import { dodgeBadgePositions } from './dodge-badge-positions.helper';

describe('dodgeBadgePositions', () => {
  it('returns positions unchanged when they are already spaced out', () => {
    expect(dodgeBadgePositions([10, 40, 70])).toEqual([10, 40, 70]);
  });

  it('pushes overlapping badges below the previous one', () => {
    expect(dodgeBadgePositions([10, 12, 14])).toEqual([10, 28, 46]);
  });

  it('walks the stack back up when it overflows the plot bottom', () => {
    expect(dodgeBadgePositions([0, 0, 0], { max: 20 })).toEqual([-16, 2, 20]);
  });
});
