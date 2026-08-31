import { describe, expect, it } from 'vitest';

import { mapPointToLog } from './map-point-to-log.helper.js';

describe('mapPointToLog', () => {
  it('projects a point into the log shape', () => {
    expect(mapPointToLog({ id: 'id1', text: 'hello', tags: ['a'] })).toEqual({
      id: 'id1',
      text: 'hello',
      tags: ['a'],
    });
  });
});
