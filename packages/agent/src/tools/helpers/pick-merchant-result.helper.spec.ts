import { describe, expect, it } from 'vitest';

import { pickMerchantResult } from './pick-merchant-result.helper.js';

describe('pickMerchantResult', () => {
  it('returns undefined for an empty store token', () => {
    expect(pickMerchantResult([{ url: 'https://example.com' }], '')).toBe(undefined);
  });

  it('picks the first result whose host carries the store token', () => {
    const results = [{ url: 'https://www.scancomputers.com/product' }, { url: 'https://other.com' }];
    expect(pickMerchantResult(results, 'scancomputers')).toBe('https://www.scancomputers.com/product');
  });

  it('matches a store token contained in a host label', () => {
    const results = [{ url: 'https://scan.co.uk/product' }];
    expect(pickMerchantResult(results, 'scancomputers')).toBe('https://scan.co.uk/product');
  });

  it('returns undefined when no result matches', () => {
    const results = [{ url: 'https://other.com' }];
    expect(pickMerchantResult(results, 'scancomputers')).toBe(undefined);
  });

  it('skips invalid URLs', () => {
    const results = [{ url: 'not a url' }, { url: 'https://scan.co.uk' }];
    expect(pickMerchantResult(results, 'scancomputers')).toBe('https://scan.co.uk');
  });
});
