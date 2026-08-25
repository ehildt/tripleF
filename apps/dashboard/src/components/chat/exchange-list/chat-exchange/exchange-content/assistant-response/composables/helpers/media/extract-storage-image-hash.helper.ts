const STORAGE_IMAGE_URL_PATTERN =
  /\/api\/v1\/storage\/[^/?#]+\/[^/?#]+\/([^/?#]+)/;

/**
 * Extract the MinIO content hash from a harness storage image URL
 * (`/api/v1/storage/{sessionId}/{conversationId}/{hash}`). The hash is the
 * object key the server ingested the image under, so registering the image
 * as a conversation file reuses it — no re-upload, no new fetch. Returns
 * null for any non-storage URL (external images, blob object URLs, pproc
 * previews) so callers can gate the add-to-files affordance on it.
 */
export function extractStorageImageHash(imageUrl: string): string | null {
  const match = STORAGE_IMAGE_URL_PATTERN.exec(imageUrl);
  return match?.[1] ?? null;
}
