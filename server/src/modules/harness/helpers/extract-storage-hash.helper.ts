/**
 * Extract the content hash from a storage URL of the form
 * `/api/v1/storage/<session>/<conversation>/<hash>`.
 */
export function extractStorageHash(url: string): string | undefined {
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) return undefined;
  const hash = url.slice(lastSlash + 1).split('?')[0];
  return hash || undefined;
}
