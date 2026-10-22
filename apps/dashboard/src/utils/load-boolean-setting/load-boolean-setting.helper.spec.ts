import { beforeEach, describe, expect, it, vi } from 'vitest';

import { loadBooleanSetting } from './load-boolean-setting.helper';

describe('loadBooleanSetting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the fallback when the key is missing', () => {
    expect(loadBooleanSetting('missing', true)).toBe(true);
    expect(loadBooleanSetting('missing', false)).toBe(false);
  });

  it('returns true only for the persisted string "true"', () => {
    localStorage.setItem('key', 'true');
    expect(loadBooleanSetting('key', false)).toBe(true);

    localStorage.setItem('key', 'false');
    expect(loadBooleanSetting('key', true)).toBe(false);
  });

  it('treats any non-"true" value as false', () => {
    localStorage.setItem('key', '1');
    expect(loadBooleanSetting('key', true)).toBe(false);
  });

  it('falls back when storage reads throw', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadBooleanSetting('key', true)).toBe(true);
  });
});
