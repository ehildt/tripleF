/**
 * True when files are attached but the model has no vision capability, so
 * those images cannot be processed by it. Models without reported
 * capabilities are assumed to support vision until their details load.
 */
export function hasVisionConflict(
  capabilities: string[] | undefined,
  files: File[],
): boolean {
  if (files.length === 0) return false;
  const supportsVision = capabilities?.includes('vision') ?? true;
  return !supportsVision;
}
