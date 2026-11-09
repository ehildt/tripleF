import { getApiUrl } from './api-url';

/** Run an image through the server's current sharp configuration. */
export async function previewSharpOverrides(image: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('images', image);

  const response = await fetch(getApiUrl('/api/v1/sharp-overrides/preview'), {
    method: 'POST',
    body: formData,
  });

  if (!response.ok)
    throw new Error(`${response.status}: ${await response.text()}`);

  const payload: unknown = await response.json();
  return payload;
}
