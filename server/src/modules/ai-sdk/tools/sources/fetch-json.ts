export async function fetchJson<T>(
  url: string,
  options: RequestInit & { timeout?: number } = {},
): Promise<{ ok: boolean; data?: T; status: number; error?: string }> {
  const { timeout = 3000, ...fetchOpts } = options;
  try {
    const res = await fetch(url, {
      ...fetchOpts,
      signal: AbortSignal.timeout(timeout),
    });
    const data = res.ok ? ((await res.json()) as T) : undefined;
    return { ok: res.ok, data, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, error: message };
  }
}
