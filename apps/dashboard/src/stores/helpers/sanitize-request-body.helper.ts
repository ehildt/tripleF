function isBase64Like(value: string): boolean {
  return value.length > 100 && /^[A-Za-z0-9+/=]+$/.test(value);
}

export function sanitizeRequestBody(
  body: string | undefined,
): string | undefined {
  if (!body) return body;
  try {
    const parsed = JSON.parse(body);
    const sanitized = JSON.parse(
      JSON.stringify(parsed, (_key, value) => {
        if (typeof value === 'string' && isBase64Like(value)) {
          const size = (value.length * 0.75) / 1024;
          return `[BASE64: ${size.toFixed(1)} KB]`;
        }
        return value;
      }),
    );
    return JSON.stringify(sanitized);
  } catch {
    return body;
  }
}
