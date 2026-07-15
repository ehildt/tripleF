import { computed, type MaybeRefOrGetter, toValue } from 'vue';

import { getApiUrl } from '@/api/api-url';
import type { Exchange } from '@/stores/conversation';
import { useConversationStore } from '@/stores/conversation';

import type { LightboxImage } from '../../composables/use-exchange-lightbox';

export function usePromptImageTiles(exchange: MaybeRefOrGetter<Exchange>) {
  const conversationStore = useConversationStore();

  const imageTiles = computed<LightboxImage[]>(() => {
    const current = toValue(exchange);
    if (!current.images?.length) return [];

    const conversation = conversationStore.conversations.find((c) =>
      c.exchanges.some((e) => e.id === current.id),
    );

    if (!conversation) return [];

    return current.images.map((image) => ({
      url: getApiUrl(
        `/api/v1/storage/${conversation.id}/${conversation.conversationId}/${image.hash}`,
      ),
      title: image.name,
    }));
  });

  return { imageTiles };
}
