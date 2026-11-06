/**
 * Extract the content hash from an object-storage URL of the form
 * `/api/v1/object-storage/<session>/<conversation>/<hash>`.
 */
export function extractObjectStorageHash(url: string): string | undefined {
  const lastSlash = url.lastIndexOf('/');
  if (lastSlash === -1) return undefined;
  const hash = url.slice(lastSlash + 1).split('?')[0];
  return hash || undefined;
}
