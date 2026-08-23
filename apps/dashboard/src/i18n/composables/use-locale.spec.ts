import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ locale: ref('en') }),
}));
vi.mock('../i18n', () => ({
  loadLocale: vi.fn(),
}));
vi.mock('../locale-codes', () => ({
  LOCALE_CODES: ['en', 'de'],
}));

import { loadLocale } from '../i18n';
import { useLocale } from './use-locale';

const mockLoadLocale = vi.mocked(loadLocale);

describe('useLocale', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('returns the supported locales', () => {
    const { supportedLocales } = useLocale();
    expect(supportedLocales).toEqual(['en', 'de']);
  });

  it('setLocale loads the bundle and persists the choice', async () => {
    const { setLocale } = useLocale();
    await setLocale('de');
    expect(mockLoadLocale).toHaveBeenCalledWith('de');
    expect(localStorage.getItem('vision-locale')).toBe('de');
  });
});
