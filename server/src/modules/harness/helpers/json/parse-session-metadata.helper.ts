/**
 * Parse the raw session-metadata JSON string into a structured shape.
 *
 * Accepts `{ images?: [{ name: string, hash: string }], merge?: {
 * fromRequestIds: string[] } }` and filters out entries missing required
 * fields. Returns undefined on parse failure or when no data is provided.
 */
export function parseSessionMetadata(raw?: string):
  | {
      images?: Array<{ name: string; hash: string; source?: string }>;
      merge?: { fromRequestIds: string[] };
    }
  | undefined {
  if (!raw) return undefined;

  try {
    const parsed = JSON.parse(raw);

    const result: {
      images?: Array<{ name: string; hash: string; source?: string }>;
      merge?: { fromRequestIds: string[] };
    } = {};

    if (Array.isArray(parsed.images)) {
      result.images = parsed.images.filter(
        (img: any): img is { name: string; hash: string; source?: string } =>
          typeof img.name === 'string' && typeof img.hash === 'string',
      );
    }

    if (parsed.merge && Array.isArray(parsed.merge.fromRequestIds)) {
      const fromRequestIds = parsed.merge.fromRequestIds.filter(
        (id: unknown): id is string => typeof id === 'string',
      );
      if (fromRequestIds.length > 0) {
        result.merge = { fromRequestIds };
      }
    }

    return result;
  } catch {
    return undefined;
  }
}
