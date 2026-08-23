import { describe, expect, it } from 'vitest';

import { buildHeaders } from './build-headers.helper';

describe('buildHeaders', () => {
  it('includes model header', () => {
    expect(buildHeaders('llama')).toEqual({
      'x-harness-llm': 'llama',
      accept: 'application/json',
    });
  });
});
