import { describe, expect, it } from 'vitest';

import { engineHasApiKey } from './engine-has-api-key.helper';

describe('engineHasApiKey', () => {
  it('is false without a snapshot', () => {
    expect(engineHasApiKey(undefined, 'serper')).toBe(false);
  });

  it('is false when the engine has no apiKey', () => {
    expect(engineHasApiKey({ serper: { enabled: true } }, 'serper')).toBe(
      false,
    );
  });

  it('is false for an empty apiKey', () => {
    expect(engineHasApiKey({ serper: { apiKey: '' } }, 'serper')).toBe(false);
  });

  it('is true when a masked apiKey is present', () => {
    expect(
      engineHasApiKey({ serper: { apiKey: 'abcd****wxyz' } }, 'serper'),
    ).toBe(true);
  });
});
