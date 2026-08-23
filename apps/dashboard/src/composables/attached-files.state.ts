import { shallowRef } from 'vue';

import type { AttachedFileEntry } from './attached-files.state.types';

export function makeKey(
  parentConversationId: string,
  conversationId: string,
): string {
  return `${parentConversationId}:${conversationId}`;
}

export const pendingFilesByConversation = shallowRef(
  new Map<string, AttachedFileEntry[]>(),
);

export function clearPendingFilesForConversation(
  parentConversationId: string,
  conversationId: string,
) {
  const key = makeKey(parentConversationId, conversationId);
  const entries = pendingFilesByConversation.value.get(key);
  if (!entries) return;
  for (const entry of entries) {
    URL.revokeObjectURL(entry.objectUrl);
  }
  const map = new Map(pendingFilesByConversation.value);
  map.delete(key);
  pendingFilesByConversation.value = map;
}
