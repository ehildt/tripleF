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
