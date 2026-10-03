import { describe, expect, it } from 'vitest';

import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import { buildActivityDescriptors } from './build-activity-descriptors.helper';

describe('buildActivityDescriptors', () => {
  it('prioritizes tool descriptors over the server step activity', () => {
    const activity: HarnessActivityDescriptor = { key: 'activity.verifying' };
    const result = buildActivityDescriptors({
      toolCalls: [{ name: 'webSearch', category: 'web', query: 'laptops' }],
      activity,
    });
    expect(result).toEqual([
      { key: 'activity.web', meta: { query: 'laptops', count: 1 } },
    ]);
  });

  it('returns tool descriptors when parallel searches run', () => {
    const result = buildActivityDescriptors({
      toolCalls: [
        { name: 'webSearch', category: 'web', query: 'laptops' },
        { name: 'imageSearch', category: 'images', query: 'laptops' },
      ],
    });
    expect(result).toEqual([
      { key: 'activity.web', meta: { query: 'laptops', count: 1 } },
      { key: 'activity.images', meta: { query: 'laptops', count: 1 } },
    ]);
  });

  it('falls back to the server step activity descriptor', () => {
    const activity: HarnessActivityDescriptor = {
      key: 'activity.understanding',
    };
    expect(buildActivityDescriptors({ activity })).toEqual([activity]);
  });

  it('returns an empty list when nothing is happening', () => {
    expect(buildActivityDescriptors({})).toEqual([]);
  });
});
