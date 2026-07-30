import type { UploadedImage } from '../conversation';

/**
 * Extract the uploaded-image entries a response carries in `meta`. Only
 * original variants become conversation uploads; derived variants (resized
 * copies) are skipped. `conversationId` is the resolved backend
 * conversation id the extracted images belong to.
 */
export function extractUploadedImagesFromResponse(
  data: Record<string, unknown>,
  conversationId: string,
): UploadedImage[] {
  const meta = data.meta as
    | Array<{
        name?: string;
        hash?: string;
        size?: number;
        variant?: string;
        source?: string;
      }>
    | undefined;
  if (!Array.isArray(meta)) return [];

  return meta
    .filter(
      (
        entry,
      ): entry is {
        name: string;
        hash: string;
        size?: number;
        source?: string;
      } =>
        typeof entry.name === 'string' &&
        typeof entry.hash === 'string' &&
        (!entry.variant || entry.variant === 'original'),
    )
    .map((entry) => ({
      name: entry.name,
      hash: entry.hash,
      size: entry.size,
      uploadedAt: Date.now(),
      selected: true,
      conversationId,
      source:
        entry.source === 'cloud' ? ('cloud' as const) : ('local' as const),
    }));
}
