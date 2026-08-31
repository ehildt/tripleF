/** Normalize a response entry into an uploaded image. */
export function mapEntryToUploadedImage(
  entry: { name: string; hash: string; size?: number; source?: string },
  conversationId: string,
) {
  return {
    name: entry.name,
    hash: entry.hash,
    size: entry.size,
    uploadedAt: Date.now(),
    selected: true,
    conversationId,
    source: entry.source === 'cloud' ? ('cloud' as const) : ('local' as const),
  };
}
