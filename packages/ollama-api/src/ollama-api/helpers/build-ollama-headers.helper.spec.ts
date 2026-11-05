import { describe, expect, it } from 'vitest';

import { buildOllamaHeaders } from './build-ollama-headers.helper.ts';

describe('buildOllamaHeaders', () => {
  it('returns no headers without an API key', () => {
    expect(buildOllamaHeaders()).toBeUndefined();
  });

  it('treats a blank key as unauthenticated', () => {
    expect(buildOllamaHeaders('   ')).toBeUndefined();
    expect(buildOllamaHeaders('')).toBeUndefined();
  });

  it('builds a bearer header and trims the key', () => {
    expect(buildOllamaHeaders('  secret-key  ')).toEqual({
      Authorization: 'Bearer secret-key',
    });
  });
});
