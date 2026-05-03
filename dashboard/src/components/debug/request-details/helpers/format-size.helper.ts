/**
 * Format a number of bytes into a short, human-friendly size string.
 */
export function formatSize(contents: unknown): string {
  const str =
    typeof contents === 'string' ? contents : JSON.stringify(contents ?? '');
  const bytes = new Blob([str]).size;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}
