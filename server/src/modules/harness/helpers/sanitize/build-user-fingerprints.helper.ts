/**
 * Collect the content fingerprints of the user's original (non-variant)
 * attachments, so ingested cloud images are not deduped against them.
 */
export function buildUserFingerprints(
  processedMeta: Array<{ variant?: string; fingerprint?: string }>,
): string[] {
  const originalEntries = processedMeta
    .map((entry, index) => ({ entry, index }))
    .filter(({ entry }) => !entry.variant || entry.variant === 'original');

  const fingerprints: string[] = [];
  for (const { entry } of originalEntries) {
    const fingerprint = entry.fingerprint;
    if (fingerprint) {
      fingerprints.push(fingerprint);
    }
  }
  return fingerprints;
}
