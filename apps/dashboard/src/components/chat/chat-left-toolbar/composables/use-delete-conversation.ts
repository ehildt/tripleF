import { deleteUploadedObject } from '@/api/object-storage.api';
import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationPersistence } from '@/components/chat/composables/use-conversation-persistence';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useSocket } from '@/composables/use-socket/use-socket';
import type {
  Conversation,
  UploadedImage,
} from '@/stores/chat/conversation/conversation.model';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { hasUploadedImageReference } from '@/stores/chat/conversation/helpers/has-uploaded-image-reference.helper';

import { isSocketEventInUse } from '../shared/helpers/is-socket-event-in-use.helper';
import { isSocketShared } from '../shared/helpers/is-socket-shared.helper';
import { useSocketSubscriptions } from './use-socket-subscriptions';

/** Delete a conversation context after leaving its sockets and storage. */
export function useDeleteConversation() {
  const conversationStore = useConversationStore();
  const catalog = useConversationCatalog();
  const configuration = useConversationConfiguration();
  const persistence = useConversationPersistence();
  const { clearPendingFiles } = usePendingAttachments();
  const socketStore = useSocket();
  const { subscriptions, removeSubscriptionByEventRoom } =
    useSocketSubscriptions();

  function leaveConversationSockets(conversation: Conversation): void {
    const socketBindings = [
      ...(conversation.event
        ? [{ event: conversation.event, roomId: conversation.roomId ?? '' }]
        : []),
      ...(conversation.subscriptions ?? []),
    ];
    for (const { event, roomId } of socketBindings) {
      if (!event) continue;
      if (
        isSocketShared(
          conversationStore.conversations,
          conversation.id,
          event,
          roomId,
        )
      ) {
        continue;
      }
      if (roomId) socketStore.closeRoom(event, roomId);
      removeSubscriptionByEventRoom(event, roomId);
      if (
        !isSocketEventInUse(
          conversationStore.conversations,
          subscriptions.value,
          conversation.id,
          event,
        )
      ) {
        socketStore.closeEvent(event);
      }
    }
  }

  async function deleteUnreferencedImages(
    conversationStoreId: string,
    serverConversationId: string,
    images: UploadedImage[],
  ): Promise<void> {
    for (const image of images) {
      const stillReferenced = hasUploadedImageReference(
        conversationStore.getConversation(conversationStoreId),
        image.hash,
        serverConversationId,
      );
      if (stillReferenced) continue;
      try {
        await deleteUploadedObject(
          conversationStoreId,
          serverConversationId,
          image.hash,
        );
      } catch {
        // Object may already be gone or storage unreachable.
      }
    }
  }

  async function deleteConversation(id: string): Promise<void> {
    const conversation = conversationStore.getConversation(id);
    if (!conversation) return;

    leaveConversationSockets(conversation);
    void configuration.setSubscriptions(id, []);

    const loaded = await catalog.loadConversationForWrite(id);
    if (!loaded) return;
    const serverConversationId = loaded.conversationId;
    const result = conversationStore.deleteConversationContext(
      id,
      serverConversationId,
    );
    if (!result) return;

    await deleteUnreferencedImages(
      id,
      serverConversationId,
      result.removedImages,
    );

    if (result.recordRemoved) {
      void persistence.removeConversationLocally(serverConversationId);
      if (result.conversationType === 'persistent') {
        void persistence.deletePersistentConversation(serverConversationId);
      }
    } else {
      await persistence.persistConversation(loaded);
    }

    clearPendingFiles({
      parentConversationId: id,
      conversationId: serverConversationId,
    });
  }

  return { deleteConversation };
}
