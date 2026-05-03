import { describe, expect, it } from 'vitest';
import { ref } from 'vue';

import { buildQueryParams } from './build-query-params.helper';

describe('buildQueryParams', () => {
  it('builds query params', () => {
    const params = buildQueryParams({
      requestId: ref('req-1'),
      sessionId: ref('sess-1'),
      roomId: ref('room-1'),
      stream: ref(true),
      event: ref('harness'),
      numCtx: ref('4096'),
      think: ref('medium'),
    });

    expect(params.get('requestId')).toBe('req-1');
    expect(params.get('sessionId')).toBe('sess-1');
    expect(params.get('roomId')).toBe('room-1');
    expect(params.get('stream')).toBe('true');
    expect(params.get('event')).toBe('harness');
    expect(params.get('numCtx')).toBe('4096');
    expect(params.get('think')).toBe('medium');
  });

  it('omits empty optional values', () => {
    const params = buildQueryParams({
      requestId: ref('req-1'),
      sessionId: ref(''),
      roomId: ref(''),
      stream: ref(false),
      event: ref('harness'),
      numCtx: ref(''),
      think: ref(''),
    });

    expect(params.get('sessionId')).toBeNull();
    expect(params.get('roomId')).toBeNull();
    expect(params.get('stream')).toBe('false');
    expect(params.get('numCtx')).toBeNull();
    expect(params.get('think')).toBeNull();
  });

  it('includes hasNewImages and conversationMetadata when provided', () => {
    const params = buildQueryParams({
      requestId: ref('req-1'),
      sessionId: ref('sess-1'),
      roomId: ref('room-1'),
      stream: ref(true),
      event: ref('harness'),
      numCtx: ref('4096'),
      think: ref('medium'),
      hasNewImages: ref(false),
      conversationMetadata: ref({
        images: [{ name: 'a.png', hash: 'hash-a' }],
      }),
    });

    expect(params.get('hasNewImages')).toBe('false');
    expect(params.get('sessionMetadata')).toBe(
      JSON.stringify({ images: [{ name: 'a.png', hash: 'hash-a' }] }),
    );
  });
});
