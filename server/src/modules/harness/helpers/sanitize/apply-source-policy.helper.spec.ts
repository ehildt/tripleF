import { describe, expect, it } from 'vitest';

import { applySourcePolicy } from './apply-source-policy.helper.js';

describe('applySourcePolicy', () => {
  it('returns items unchanged when there is no policy', () => {
    const items = [{ url: 'https://a.com' }];
    expect(applySourcePolicy(items, undefined)).toBe(items);
  });

  it('drops entries from blocked domains', () => {
    const items = [
      { url: 'https://blocked.com/a' },
      { url: 'https://ok.com/a' },
    ];
    const result = applySourcePolicy(items, {
      preferred: [],
      blocked: ['blocked.com'],
    });
    expect(result).toEqual([{ url: 'https://ok.com/a' }]);
  });

  it('blanks blocked urls inside surviving entries', () => {
    const items = [
      { url: 'https://ok.com/a', imageUrl: 'https://blocked.com/i.jpg' },
    ];
    const result = applySourcePolicy(items, {
      preferred: [],
      blocked: ['blocked.com'],
    });
    expect(result[0].imageUrl).toBe('');
    expect(result[0].url).toBe('https://ok.com/a');
  });

  it('surfaces preferred domains first', () => {
    const items = [
      { url: 'https://other.com/a' },
      { url: 'https://preferred.com/a' },
    ];
    const result = applySourcePolicy(items, {
      preferred: ['preferred.com'],
      blocked: [],
    });
    expect(result[0].url).toBe('https://preferred.com/a');
  });
});
