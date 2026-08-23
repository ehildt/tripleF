import type { Conversation } from '@/stores/conversation';

/**
 * Whether a conversation contains at least one video in any of its
 * assistant responses. Videos appear in harnessData either as a
 * videoGalleryItems array (article + videolist templates) or a single
 * heroVideoUrl (article hero media).
 */
export function conversationHasVideos(
  conversation: Conversation | null,
): boolean {
  if (!conversation) return false;
  return conversation.exchanges.some(
    (exchange) =>
      (exchange.harnessData?.videoGalleryItems?.length ?? 0) > 0 ||
      Boolean(exchange.harnessData?.heroVideoUrl),
  );
}
