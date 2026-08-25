import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { getApiUrl } from '@/api/api-url';
import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

/**
 * Map an exchange's attached documents to preview tiles: the storage url of
 * the original file (uploaded via the originals field) plus the display
 * name, so clicking a tile can open the document preview.
 */
export function usePromptDocumentTiles(exchange: MaybeRefOrGetter<Exchange>) {
  const conversationStore = useConversationStore();

  const documentTiles = computed<{ name: string; url: string }[]>(() => {
    const current = toValue(exchange);
    if (!current.documents?.length) return [];

    const conversation = conversationStore.conversations.find((c) =>
      c.exchanges.some((e) => e.id === current.id),
    );
    if (!conversation) return [];

    // pdf documents render as page-image tiles, not document icons — skip
    // any stragglers (e.g. pre-rework sessions) so they never open the
    // text preview accidentally.
    return current.documents
      .filter((doc) => !doc.name.toLowerCase().endsWith('.pdf'))
      .map((doc) => ({
        name: doc.name,
        url: getApiUrl(
          `/api/v1/storage/${conversation.id}/${conversation.conversationId}/${doc.hash}`,
        ),
      }));
  });

  return { documentTiles };
}
