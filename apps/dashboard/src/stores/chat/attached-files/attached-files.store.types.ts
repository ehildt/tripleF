export interface PendingAttachmentScope {
  /** Internal parent/session conversation id used by the client store. */
  parentConversationId: string;
  /** Stable/server conversation id used by object storage and the harness. */
  conversationId: string;
}
