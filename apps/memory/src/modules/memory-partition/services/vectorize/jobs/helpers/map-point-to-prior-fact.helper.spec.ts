import { describe, expect, it } from 'vitest';

import { mapPointToPriorFact } from './map-point-to-prior-fact.helper.js';

describe('mapPointToPriorFact', () => {
  it('projects a point into the prior-fact shape', () => {
    expect(mapPointToPriorFact({ text: 'hello' })).toEqual({ text: 'hello' });
  });
});
