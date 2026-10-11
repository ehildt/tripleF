import { describe, expect, it } from 'vitest';

import { loadSubscriptions } from './load-subscriptions.helper';

describe('loadSubscriptions', () => {
  it('returns an empty list when the key is absent', () => {
    expect(loadSubscriptions('missing-key')).toEqual([]);
  });

  it('parses a persisted subscription list', () => {
    localStorage.setItem(
      'subs',
      JSON.stringify([{ event: 'e', roomId: '', active: true, stream: true }]),
    );
    expect(loadSubscriptions('subs')).toEqual([
      { event: 'e', roomId: '', active: true, stream: true },
    ]);
  });

  it('returns an empty list on unparsable JSON', () => {
    localStorage.setItem('subs', 'not-json');
    expect(loadSubscriptions('subs')).toEqual([]);
  });
});
