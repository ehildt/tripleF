import { describe, expect, it } from 'vitest';

import type { Exchange } from '@/stores/chat/conversation/conversation.model';

import { toMergeMaterial } from './to-merge-material.helper';

describe('toMergeMaterial', () => {
  it('serializes assistant answers with harness data as structured JSON', () => {
    const exchange = {
      role: 'assistant',
      responseTemplate: 'news',
      responseData: { headline: 'H' },
    } as unknown as Exchange;
    const material = toMergeMaterial(exchange);
    expect(JSON.parse(material)).toEqual({
      template: 'news',
      data: { headline: 'H' },
    });
  });

  it('returns the plain content for a user exchange', () => {
    const exchange = { role: 'user', content: 'plain text' } as Exchange;
    expect(toMergeMaterial(exchange)).toBe('plain text');
  });

  it('falls back to "(no content)" for an empty message', () => {
    const exchange = { role: 'user', content: '' } as Exchange;
    expect(toMergeMaterial(exchange)).toBe('(no content)');
  });
});
