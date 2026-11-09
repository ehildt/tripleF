import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_PREPROCESSING_SETTINGS } from '@/stores/preprocessing-settings/preprocessing-settings.constant';

import { saveSharpOverrides } from './save-sharp-overrides.api';

describe('saveSharpOverrides', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('puts the complete settings snapshot as JSON', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    await saveSharpOverrides(DEFAULT_PREPROCESSING_SETTINGS);

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/sharp-overrides', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(DEFAULT_PREPROCESSING_SETTINGS),
    });
  });

  it('rejects a non-success response', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 400 }));

    await expect(
      saveSharpOverrides(DEFAULT_PREPROCESSING_SETTINGS),
    ).rejects.toThrow('Failed to save preprocessing settings: 400');
  });
});
