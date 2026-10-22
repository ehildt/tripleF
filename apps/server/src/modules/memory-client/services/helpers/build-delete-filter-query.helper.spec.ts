import { describe, expect, it } from 'vitest';

import { buildDeleteFilterQuery } from './build-delete-filter-query.helper.js';

/**
 * Wire contract of `DELETE /api/v1/memory/text`: the memory app reads these
 * query params by name, so the serialized names and shapes are the contract —
 * renaming a param here silently widens (or empties) the delete.
 */
describe('buildDeleteFilterQuery', () => {
  it('serializes the required partition on its own', () => {
    expect(buildDeleteFilterQuery({ memoryPartition: 'user-1' })).toBe(
      'memoryPartition=user-1',
    );
  });

  it('emits the cognition lane as a boolean flag', () => {
    expect(
      buildDeleteFilterQuery({ memoryPartition: 'ai-1', cognition: true }),
    ).toBe('memoryPartition=ai-1&cognition=true');
  });

  it('omits absent and falsy optional filters', () => {
    expect(
      buildDeleteFilterQuery({
        memoryPartition: 'user-1',
        cognition: false,
        sessionId: '',
      }),
    ).toBe('memoryPartition=user-1');
  });

  it('serializes every optional scope field', () => {
    const query = buildDeleteFilterQuery({
      memoryPartition: 'user-1',
      sessionId: 's1',
      conversationId: 'c1',
      requestId: 'r1',
      text: 'exact',
      contains: 'partial',
      path: 'profile.facts',
    });
    const params = new URLSearchParams(query);

    expect(Object.fromEntries(params)).toEqual({
      memoryPartition: 'user-1',
      sessionId: 's1',
      conversationId: 'c1',
      requestId: 'r1',
      text: 'exact',
      contains: 'partial',
      path: 'profile.facts',
    });
  });

  it('joins tags as CSV and omits an empty tag list', () => {
    expect(
      buildDeleteFilterQuery({ memoryPartition: 'user-1', tags: ['a', 'b'] }),
    ).toBe('memoryPartition=user-1&tags=a%2Cb');
    expect(
      buildDeleteFilterQuery({ memoryPartition: 'user-1', tags: [] }),
    ).toBe('memoryPartition=user-1');
  });

  it('url-encodes values that are unsafe in a query string', () => {
    const query = buildDeleteFilterQuery({
      memoryPartition: 'user 1',
      text: 'a&b=c',
    });

    expect(query).toBe('memoryPartition=user+1&text=a%26b%3Dc');
  });
});
