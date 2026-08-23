/**
 * Format image dimensions for the tile badge, e.g. "2560×1440". Returns an
 * empty string when either dimension is missing.
 */
export function formatDimensions(width?: number, height?: number): string {
  if (!width || !height) return '';
  return `${width}×${height}`;
}
