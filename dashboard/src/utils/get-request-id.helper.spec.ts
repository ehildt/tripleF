import { describe, expect, it } from 'vitest';

import { getRequestId } from './get-request-id.helper';

describe('getRequestId', () => {
  it('extracts requestId from object', () => {
    expect(getRequestId({ requestId: 'abc' })).toBe('abc');
  });

  it('returns undefined when requestId missing', () => {
    expect(getRequestId({})).toBeUndefined();
  });

  it('returns undefined for non-object', () => {
    expect(getRequestId(null)).toBeUndefined();
    expect(getRequestId('string')).toBeUndefined();
  });
});
