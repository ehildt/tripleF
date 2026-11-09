import { getApiUrl } from './api-url';

/** Fetch the server's effective preprocessing configuration for validation by the sync workflow. */
export async function fetchSharpOverrides(): Promise<unknown> {
  const response = await fetch(getApiUrl('/api/v1/sharp-overrides'));

  if (!response.ok)
    throw new Error(
      `Failed to load preprocessing settings: ${response.status}`,
    );

  const payload: unknown = await response.json();
  return payload;
}
