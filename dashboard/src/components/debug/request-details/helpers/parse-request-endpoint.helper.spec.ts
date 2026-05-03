import { describe, expect, it } from 'vitest';

import type { DebugResult } from '../../../../types/debug.model';
import { parseRequestEndpoint } from './parse-request-endpoint.helper';

const makeResult = (partial: Partial<DebugResult>): DebugResult =>
  ({
    id: '1',
    endpoint: '/api/v1/test?requestId=req-1&model=llama',
    method: 'POST',
    status: 'success',
    responseTime: 0,
    type: 'http',
    direction: 'request',
    ...partial,
  }) as DebugResult;

describe('parseRequestEndpoint', () => {
  it('returns empty defaults for a null result', () => {
    const parsed = parseRequestEndpoint(null);
    expect(parsed.path).toBe('');
    expect(parsed.event).toBe('');
    expect(parsed.params).toEqual([]);
  });

  it('filters out known params for http results', () => {
    const parsed = parseRequestEndpoint(makeResult({}));
    expect(parsed.path).toBe('/api/v1/test');
    expect(parsed.params).toEqual([]);
  });

  it('keeps unknown params for http results', () => {
    const parsed = parseRequestEndpoint(
      makeResult({ endpoint: '/api/v1/test?foo=bar' }),
    );
    expect(parsed.params).toEqual([{ key: 'foo', value: 'bar' }]);
  });

  it('parses socket endpoints', () => {
    const parsed = parseRequestEndpoint(
      makeResult({
        endpoint: 'socket.io:harness:room:room1',
        type: 'socket',
      }),
    );
    expect(parsed.event).toBe('harness');
    expect(parsed.room).toBe('room1');
  });
});
