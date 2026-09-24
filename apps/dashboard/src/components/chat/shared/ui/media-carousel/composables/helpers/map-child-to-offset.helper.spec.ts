import { describe, expect, it } from 'vitest';

import { mapChildToOffset } from './map-child-to-offset.helper';

describe('mapChildToOffset', () => {
  it('projects a track child into its offset shape', () => {
    const el = { offsetLeft: 10, offsetWidth: 100 } as HTMLElement;
    expect(mapChildToOffset(el)).toEqual({ offsetLeft: 10, offsetWidth: 100 });
  });
});
