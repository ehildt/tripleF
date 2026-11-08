export interface DlqRetrySession {
  /** Local store id of the existing or recovered target conversation. */
  conversationStoreId: string;
  /** Original failed harness request id reused by the retry. */
  requestId: string;
  /** Original socket event/channel to subscribe and track. */
  event: string;
  /** Original socket room; empty when the conversation is room-less. */
  roomId: string;
  /** Original stream mode used for pending-message bookkeeping. */
  stream: boolean;
}
