import { beforeEach, describe, expect, it, vi } from 'vitest';

import { saveBooleanSetting } from './save-boolean-setting.helper';

describe('saveBooleanSetting', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('persists true as the string "true"', () => {
    saveBooleanSetting('key', true);
    expect(localStorage.getItem('key')).toBe('true');
  });

  it('persists false as the string "false"', () => {
    saveBooleanSetting('key', false);
    expect(localStorage.getItem('key')).toBe('false');
  });

  it('swallows storage write failures', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota');
    });
    expect(() => saveBooleanSetting('key', true)).not.toThrow();
  });
});
