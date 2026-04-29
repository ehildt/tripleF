export function formatBody(
  body: string | Record<string, unknown> | undefined,
): string {
  if (!body) return '';
  if (typeof body === 'object') {
    return JSON.stringify(body, null, 2);
  }
  try {
    const parsed = JSON.parse(body);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return body;
  }
}

export function formatJson(data: unknown): string {
  if (data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    if (
      'message' in d &&
      d.message &&
      typeof d.message === 'object' &&
      'content' in (d.message as any)
    ) {
      return (d.message as any).content;
    }
    const filtered = Object.fromEntries(
      Object.keys(d)
        .filter((k) => k !== 'pending')
        .map((k) => [k, d[k]]),
    );
    return JSON.stringify(filtered, null, 2);
  }
  return JSON.stringify(data, null, 2);
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}
