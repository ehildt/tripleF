import { describe, expect, it } from 'vitest';

import {
  type ActiveToolCall,
  buildToolActivityDescriptors,
} from './build-tool-activity-descriptors.helper';

describe('buildToolActivityDescriptors', () => {
  it('returns no descriptors without tool calls', () => {
    expect(buildToolActivityDescriptors([])).toEqual([]);
  });

  it('maps a known category to its activity key with query and count', () => {
    const calls: ActiveToolCall[] = [
      { name: 'webSearch', category: 'web', query: 'laptops' },
      { name: 'serperWebSearch', category: 'web', query: 'laptops' },
    ];
    expect(buildToolActivityDescriptors(calls)).toEqual([
      { key: 'activity.web', meta: { query: 'laptops', count: 2 } },
    ]);
  });

  it('drops the query when parallel calls in a category diverge', () => {
    const calls: ActiveToolCall[] = [
      { name: 'webSearch', category: 'web', query: 'laptops' },
      { name: 'serperWebSearch', category: 'web', query: 'phones' },
    ];
    expect(buildToolActivityDescriptors(calls)).toEqual([
      { key: 'activity.web', meta: { query: undefined, count: 2 } },
    ]);
  });

  it('omits the query fragment entirely when there is none', () => {
    const calls: ActiveToolCall[] = [
      { name: 'imageSearch', category: 'images' },
    ];
    expect(buildToolActivityDescriptors(calls)).toEqual([
      { key: 'activity.images', meta: { query: undefined, count: 1 } },
    ]);
  });

  it('truncates long queries to keep the label short', () => {
    const longQuery = 'a'.repeat(120);
    const calls: ActiveToolCall[] = [
      { name: 'webSearch', category: 'web', query: longQuery },
    ];
    const [descriptor] = buildToolActivityDescriptors(calls);
    expect(descriptor.meta?.query).toBe(`${'a'.repeat(48)}…`);
  });

  it('emits one descriptor per category instead of chaining them', () => {
    const calls: ActiveToolCall[] = [
      { name: 'webSearch', category: 'web', query: 'cars' },
      { name: 'imageSearch', category: 'images', query: 'cars' },
      { name: 'videoSearch', category: 'videos', query: 'cars' },
    ];
    expect(buildToolActivityDescriptors(calls)).toEqual([
      { key: 'activity.web', meta: { query: 'cars', count: 1 } },
      { key: 'activity.images', meta: { query: 'cars', count: 1 } },
      { key: 'activity.videos', meta: { query: 'cars', count: 1 } },
    ]);
  });

  it('falls back to the generic executing label for unknown categories', () => {
    const calls: ActiveToolCall[] = [
      { name: 'customTool', category: 'other', query: 'x' },
      { name: 'customTool', category: 'other', query: 'y' },
    ];
    expect(buildToolActivityDescriptors(calls)).toEqual([
      { key: 'activity.executingTool', meta: { tool: 'customTool', count: 2 } },
    ]);
  });
});
