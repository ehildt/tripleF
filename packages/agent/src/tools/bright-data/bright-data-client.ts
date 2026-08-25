import { fetchWithTimeout } from '../helpers/fetch-with-timeout.js';

const BRIGHT_DATA_ENDPOINT = 'https://api.brightdata.com/request';

/**
 * POST a target URL to the Bright Data SERP/Unlocker `/request` endpoint.
 * Both SERP API and Web Unlocker share this single endpoint and are
 * distinguished only by the `zone` value. Returns the parsed response body.
 * Throws on transport/HTTP errors so callers can log and degrade gracefully.
 */
export async function requestBrightData(
  apiKey: string,
  zone: string,
  url: string,
  opts: { markdown?: boolean; timeoutMs: number },
): Promise<unknown> {
  const res = await fetchWithTimeout(
    BRIGHT_DATA_ENDPOINT,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        zone,
        url,
        format: 'raw',
        ...(opts.markdown ? { data_format: 'markdown' } : {}),
      }),
    },
    { timeoutMs: opts.timeoutMs },
  );
  if (!res.ok) throw new Error(`Bright Data returned HTTP ${res.status}`);
  if (opts.markdown) return { text: await res.text() };
  return res.json();
}
