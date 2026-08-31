import { describe, expect, it } from 'vitest';

import { mapVectorizeJob } from './map-vectorize-job.helper.js';

describe('mapVectorizeJob', () => {
  it('wraps a vectorize payload into a job descriptor', () => {
    const data = { memoryPartition: 'p', role: 'user', text: 'hello' } as never;
    expect(mapVectorizeJob(data)).toEqual({ name: 'vectorize', data });
  });
});
