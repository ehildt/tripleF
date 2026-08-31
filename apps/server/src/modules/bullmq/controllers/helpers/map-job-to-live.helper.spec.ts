import { describe, expect, it } from 'vitest';

import { mapJobToLive } from './map-job-to-live.helper.js';

describe('mapJobToLive', () => {
  it('projects a job into the live-jobs shape', () => {
    const job = {
      id: '1',
      name: 'harness',
      getState: () => 'active',
      attemptsMade: 2,
    } as never;
    expect(mapJobToLive(job)).toEqual({
      id: '1',
      name: 'harness',
      state: 'active',
      attemptsMade: 2,
    });
  });
});
