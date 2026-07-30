/**
 * Build the warning shown when the user attaches files to a request whose
 * model has no vision capability. Models without reported capabilities are
 * assumed to support images, so the warning only appears for explicit
 * non-vision models.
 */
export function buildModelVisionWarning(
  modelName: string,
  capabilities: string[] | undefined,
  files: File[],
): string | null {
  if (files.length === 0) return null;
  const supportsVision = capabilities?.includes('vision') ?? true;
  if (supportsVision) return null;
  return `Model "${modelName}" does not support images. They will be excluded from this request.`;
}
