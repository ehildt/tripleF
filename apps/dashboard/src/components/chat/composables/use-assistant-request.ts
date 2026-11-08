import { getApiUrl } from '@/api/api-url';
import { buildHeaders } from '@/components/chat/composables/helpers/build-headers.helper';
import { handleResponse } from '@/components/chat/composables/helpers/handle-response.helper';
import { useConversationConfiguration } from '@/components/chat/composables/use-conversation-configuration';
import { useConversationDocuments } from '@/components/chat/composables/use-conversation-documents';
import { useConversationExchangeCompletion } from '@/components/chat/composables/use-conversation-exchange-completion';
import { useConversationImages } from '@/components/chat/composables/use-conversation-images';
import { useSocketProvider } from '@/components/chat/composables/use-socket-provider';
import { usePendingAttachments } from '@/components/chat/shared/composables/use-pending-attachments';
import { useToast } from '@/composables/use-toast/use-toast';
import { i18n } from '@/i18n/i18n';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';

import type { PostHarnessRequestOptions } from './use-assistant-request.types';

/**
 * Sends a prepared prompt to the harness, registers the in-flight request for
 * socket tracking, and settles the outcome: success promotes the pending
 * attachments, failure marks the exchange as errored. Errors are reported
 * through toasts; the caller owns the loading state.
 */
export function useAssistantRequest() {
  const socketProvider = useSocketProvider();

  const conversationStore = useConversationStore();
  const configuration = useConversationConfiguration();
  const completion = useConversationExchangeCompletion();
  const images = useConversationImages();
  const documents = useConversationDocuments();
  const { clearPendingFiles } = usePendingAttachments();
  const toast = useToast();

  async function postHarnessRequest(
    request: PostHarnessRequestOptions,
  ): Promise<void> {
    const {
      model,
      requestId,
      sid,
      room,
      event,
      params,
      formData,
      stream,
      numCtx,
      referencedImages,
      newDocuments,
      conversationId,
    } = request;

    const socket = socketProvider.getSocket();
    const headers = buildHeaders(model);

    const fetchPromise = fetch(
      getApiUrl(`/api/v1/harness?${params.toString()}`),
      {
        method: 'POST',
        headers,
        body: formData,
      },
    );

    socketProvider.trackRequest(
      getApiUrl(
        `/api/v1/harness${params.toString() ? '?' + params.toString() : ''}`,
      ),
      'POST',
      fetchPromise,
      {
        headers,
        formData,
        requestId,
        roomId: room,
        event,
        numCtx,
        stream,
        model,
      },
    );

    try {
      const res = await fetchPromise;
      if (!res.ok) {
        const text = await res.text();
        const msg = `${res.status}: ${text}`;
        toast.debug(msg);
        toast.error(
          i18n.global.t('toast.requestError', { status: res.status }),
        );
        const id = conversationStore.activeConversationId;
        if (id) void completion.markExchangeError(id, requestId, msg);
        return;
      }

      handleResponse(res, socket, toast);

      // Promote pending previews to uploaded metadata and clear the pending
      // attachment state for this conversation.
      if (sid) {
        void images.setUploadedImages(sid, referencedImages);
        void documents.setUploadedDocuments(sid, newDocuments);
        clearPendingFiles({
          parentConversationId: sid,
          conversationId,
        });
        void configuration.setSavedFileInfos(sid, []);
      }
    } catch (e: unknown) {
      // ! we should find a way to streamline our errors so they have a consistent shape.
      // ! lets check if there a lib for vue3/alternative that already handles this for us.
      const msg = e instanceof Error ? e.message : String(e);
      toast.debug(msg);
      toast.error(i18n.global.t('toast.serverUnreachable'));
      const id = conversationStore.activeConversationId;
      if (id) void completion.markExchangeError(id, requestId, msg);
    }
  }

  return { postHarnessRequest };
}
