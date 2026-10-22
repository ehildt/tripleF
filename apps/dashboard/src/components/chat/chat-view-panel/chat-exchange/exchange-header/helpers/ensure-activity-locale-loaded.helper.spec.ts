import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ensureActivityLocaleLoaded } from './ensure-activity-locale-loaded.helper';

describe('ensureActivityLocaleLoaded', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('is a no-op for an unsupported locale code', async () => {
    await expect(
      ensureActivityLocaleLoaded('xx-nonsense'),
    ).resolves.toBeUndefined();
  });

  it('registers a supported locale without switching the active locale', async () => {
    const { i18n } = await import('@/i18n/i18n');
    vi.spyOn(i18n.global, 'getLocaleMessage').mockReturnValue(
      undefined as never,
    );
    const setLocaleMessage = vi.spyOn(i18n.global, 'setLocaleMessage');

    await ensureActivityLocaleLoaded('en');

    expect(setLocaleMessage).toHaveBeenCalledWith('en', expect.anything());
  });

  it('skips the loader when the locale is already registered', async () => {
    const { i18n } = await import('@/i18n/i18n');
    vi.spyOn(i18n.global, 'getLocaleMessage').mockReturnValue({} as never);
    const setLocaleMessage = vi.spyOn(i18n.global, 'setLocaleMessage');

    await ensureActivityLocaleLoaded('en');

    expect(setLocaleMessage).not.toHaveBeenCalled();
  });
});
