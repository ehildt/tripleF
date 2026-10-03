import { describe, expect, it } from 'vitest';

import { buildSubmitQueryParams } from './build-submit-query-params.helper';
import type { BuildSubmitQueryParamsOptions } from './build-submit-query-params.helper.types';

function createOptions(
  overrides: Partial<BuildSubmitQueryParamsOptions> = {},
): BuildSubmitQueryParamsOptions {
  return {
    requestId: 'req-1',
    sessionId: 'sid-1',
    memoryPartition: '',
    memoryCognition: '',
    conversationId: 'cid-1',
    roomId: 'room-1',
    event: 'chat',
    hasNewImages: false,
    language: 'en',
    ...overrides,
  };
}

describe('buildSubmitQueryParams', () => {
  it('applies conversation defaults when settings are omitted', () => {
    const params = buildSubmitQueryParams(createOptions());

    expect(params.get('stream')).toBe('true');
    expect(params.get('think')).toBe('medium');
    expect(params.has('numCtx')).toBe(false);
  });

  it('forwards explicit conversation settings', () => {
    const params = buildSubmitQueryParams(
      createOptions({ stream: false, numCtx: '4096', think: 'high' }),
    );

    expect(params.get('stream')).toBe('false');
    expect(params.get('numCtx')).toBe('4096');
    expect(params.get('think')).toBe('high');
  });

  it('omits empty overrides and appends request correlation fields', () => {
    const params = buildSubmitQueryParams(createOptions());

    expect(params.get('requestId')).toBe('req-1');
    expect(params.get('sessionId')).toBe('sid-1');
    expect(params.get('conversationId')).toBe('cid-1');
    expect(params.get('hasNewImages')).toBe('false');
    expect(params.has('memoryPartition')).toBe(false);
    expect(params.has('memoryCognition')).toBe(false);
  });

  it('serializes conversation metadata and the language', () => {
    const params = buildSubmitQueryParams(
      createOptions({
        memoryPartition: 'mem',
        memoryCognition: 'cog',
        hasNewImages: true,
        conversationMetadata: { images: [{ name: 'a.png', hash: 'h' }] },
      }),
    );

    expect(params.get('memoryPartition')).toBe('mem');
    expect(params.get('memoryCognition')).toBe('cog');
    expect(params.get('hasNewImages')).toBe('true');
    expect(params.get('language')).toBe('en');
    expect(JSON.parse(params.get('sessionMetadata') ?? '{}')).toEqual({
      images: [{ name: 'a.png', hash: 'h' }],
    });
  });
});
