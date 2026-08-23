import { describe, expect, it } from 'vitest';

import { storeHostToken } from './store-host-token.helper.js';

describe('storeHostToken', () => {
  it('normalizes a merchant name to a host-comparable token', () => {
    expect(storeHostToken('MediaMarkt')).toBe('mediamarkt');
    expect(storeHostToken('Scan Computers')).toBe('scancomputers');
  });

  it('drops legal-form and tld tokens', () => {
    expect(storeHostToken('Amazon.de')).toBe('amazon');
    expect(storeHostToken('notebooksbilliger.de')).toBe('notebooksbilliger');
    expect(storeHostToken('MediaMarkt GmbH')).toBe('mediamarkt');
  });

  it('returns an empty string for only non-identity tokens', () => {
    expect(storeHostToken('com')).toBe('');
  });
});
