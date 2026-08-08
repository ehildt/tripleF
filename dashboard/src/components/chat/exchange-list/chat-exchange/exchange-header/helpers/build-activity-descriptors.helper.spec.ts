import { describe, expect, it } from 'vitest';

import type { HarnessActivityDescriptor } from '@/types/harness-activity.model';

import { buildActivityDescriptors } from './build-activity-descriptors.helper';

describe('buildActivityDescriptors', () => {
  it('prioritizes the consolidating descriptor while reasoning streams', () => {
    const activity: HarnessActivityDescriptor = { key: 'activity.verifying' };
    const result = buildActivityDescriptors({
      reasoning: 'Thinking through the request',
      activity,
    });
    expect(result).toEqual([{ key: 'activity.consolidating' }]);
  });

  it('returns tool descriptors when no reasoning is present', () => {
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
