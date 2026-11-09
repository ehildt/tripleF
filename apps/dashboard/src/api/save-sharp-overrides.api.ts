import type { PreprocessingSettings } from '@/types/preprocessing.model';

import { getApiUrl } from './api-url';

/** Persist the global sharp overrides that control subsequent server-side image processing. */
export async function saveSharpOverrides(
  settings: PreprocessingSettings,
): Promise<void> {
  const response = await fetch(getApiUrl('/api/v1/sharp-overrides'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });

  if (!response.ok)
    throw new Error(
      `Failed to save preprocessing settings: ${response.status}`,
    );
}
