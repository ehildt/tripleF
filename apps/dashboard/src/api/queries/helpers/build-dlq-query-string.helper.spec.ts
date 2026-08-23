import { describe, expect, it } from 'vitest';

import { buildDlqQueryString } from './build-dlq-query-string.helper';

describe('buildDlqQueryString', () => {
  it('returns empty string when no params are set', () => {
    expect(buildDlqQueryString({})).toBe('');
  });

  it('builds a query string with all params', () => {
    const result = buildDlqQueryString({
      status: 'Failed',
      queueName: 'harness',
      jobName: 'req-1',
      search: 'error',
      limit: 10,
      offset: 20,
    });
    expect(result).toContain('status=Failed');
    expect(result).toContain('queueName=harness');
    expect(result).toContain('jobName=req-1');
    expect(result).toContain('search=error');
    expect(result).toContain('limit=10');
    expect(result).toContain('offset=20');
  });
});
