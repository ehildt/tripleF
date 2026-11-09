import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useModelWarmingPreference } from './use-model-warming-preference';

describe('useModelWarmingPreference', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    const preference = useModelWarmingPreference();
    if (preference.warmModelOnSelect.value) {
      preference.toggleWarmModelOnSelect();
    }
    localStorage.clear();
  });

  it('defaults to disabled', () => {
    expect(useModelWarmingPreference().warmModelOnSelect.value).toBe(false);
  });

  it('shares and persists toggle changes', () => {
    const first = useModelWarmingPreference();
    const second = useModelWarmingPreference();

    first.toggleWarmModelOnSelect();
    expect(second.warmModelOnSelect.value).toBe(true);
    expect(localStorage.getItem('harness-warm-model-on-select')).toBe('true');

    second.toggleWarmModelOnSelect();
    expect(first.warmModelOnSelect.value).toBe(false);
    expect(localStorage.getItem('harness-warm-model-on-select')).toBe('false');
  });

  it('keeps the in-memory value when storage is denied', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    const preference = useModelWarmingPreference();

    preference.toggleWarmModelOnSelect();

    expect(preference.warmModelOnSelect.value).toBe(true);
  });
});
