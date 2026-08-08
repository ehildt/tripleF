import { describe, expect, it } from 'vitest';

import { buildQueryParams } from './build-query-params.helper';

describe('buildQueryParams', () => {
  it('builds query params', () => {
    const params = buildQueryParams({
      requestId: 'req-1',
      sessionId: 'sess-1',
      roomId: 'room-1',
      stream: true,
      event: 'harness',
      numCtx: '4096',
      think: 'medium',
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
      requestId: 'req-1',
      sessionId: '',
      roomId: '',
      stream: false,
      event: 'harness',
      numCtx: '',
      think: '',
    });

    expect(params.get('sessionId')).toBeNull();
    expect(params.get('roomId')).toBeNull();
    expect(params.get('stream')).toBe('false');
    expect(params.get('numCtx')).toBeNull();
    expect(params.get('think')).toBeNull();
  });

  it('includes hasNewImages and conversationMetadata when provided', () => {
    const params = buildQueryParams({
      requestId: 'req-1',
      sessionId: 'sess-1',
      roomId: 'room-1',
      stream: true,
      event: 'harness',
      numCtx: '4096',
      think: 'medium',
      hasNewImages: false,
      conversationMetadata: {
        images: [{ name: 'a.png', hash: 'hash-a' }],
      },
    });

    expect(params.get('hasNewImages')).toBe('false');
    expect(params.get('sessionMetadata')).toBe(
      JSON.stringify({ images: [{ name: 'a.png', hash: 'hash-a' }] }),
    );
  });

  it('includes language when provided and omits it when empty', () => {
    const params = buildQueryParams({
      requestId: 'req-1',
      sessionId: 'sess-1',
      roomId: 'room-1',
      stream: true,
      event: 'harness',
      numCtx: '4096',
      think: 'medium',
      language: 'de',
    });
    expect(params.get('language')).toBe('de');

    const withoutLanguage = buildQueryParams({
      requestId: 'req-1',
      sessionId: 'sess-1',
      roomId: 'room-1',
      stream: true,
      event: 'harness',
      numCtx: '4096',
      think: 'medium',
    });
    expect(withoutLanguage.get('language')).toBeNull();
  });
});
