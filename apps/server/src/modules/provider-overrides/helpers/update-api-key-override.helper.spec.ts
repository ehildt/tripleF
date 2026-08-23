import { describe, expect, it } from 'vitest';

import { updateApiKeyOverride } from './update-api-key-override.helper.js';

describe('updateApiKeyOverride', () => {
  it('ignores masked values', () => {
    const overrides = { serper: { apiKey: 'old' } };
    updateApiKeyOverride(overrides, 'serper', '****************');
    expect(overrides.serper.apiKey).toBe('old');
  });

  it('clears the override for an empty value', () => {
    const overrides = { serper: { apiKey: 'old' } };
    updateApiKeyOverride(overrides, 'serper', '   ');
    expect(overrides.serper.apiKey).toBeUndefined();
  });

  it('sets a new trimmed key', () => {
    const overrides = { serper: { apiKey: 'old' } };
    updateApiKeyOverride(overrides, 'serper', '  new-key  ');
    expect(overrides.serper.apiKey).toBe('new-key');
  });

  it('ignores non-string values', () => {
    const overrides = { serper: { apiKey: 'old' } };
    updateApiKeyOverride(overrides, 'serper', 123);
    expect(overrides.serper.apiKey).toBe('old');
  });
});
