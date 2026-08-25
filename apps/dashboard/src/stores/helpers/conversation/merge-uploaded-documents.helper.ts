import type { UploadedDocument } from '../../conversation.model';

/**
 * Merge newly uploaded documents into the conversation's existing entries.
 * Entries are deduplicated by `hash + conversationId` and the first
 * occurrence (the stored entry) is kept: its selection state always wins.
 * `conversationId` is the resolved backend conversation id used for entries
 * that don't carry one.
 */
export function mergeUploadedDocuments(
  existingDocuments: UploadedDocument[],
  incomingDocuments: UploadedDocument[],
  conversationId: string,
): UploadedDocument[] {
  const seen = new Set<string>();
  const merged: UploadedDocument[] = [];

  for (const doc of [...existingDocuments, ...incomingDocuments]) {
    const key = `${doc.hash}:${doc.conversationId ?? conversationId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const existing = existingDocuments.find(
      (d) =>
        d.hash === doc.hash &&
        (d.conversationId ?? conversationId) ===
          (doc.conversationId ?? conversationId),
    );
    merged.push({
      ...doc,
      conversationId: doc.conversationId ?? conversationId,
      selected: existing?.selected ?? doc.selected ?? true,
    });
  }

  return merged;
}
