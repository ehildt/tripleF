/**
 * Parse the raw session-metadata JSON string into a structured shape.
 *
 * Accepts `{ images?: [{ name: string, hash: string }] }` and filters out
 * entries missing required fields. Returns undefined on parse failure or when
 * no data is provided.
 */
export function parseSessionMetadata(
  raw?: string,
):
  | { images?: Array<{ name: string; hash: string; source?: string }> }
  | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.images)) return { images: [] };

    return {
      images: parsed.images.filter(
        (img: any): img is { name: string; hash: string; source?: string } =>
          typeof img.name === 'string' && typeof img.hash === 'string',
      ),
    };
  } catch {
    return undefined;
  }
}
