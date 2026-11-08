export interface DlqEntryFilters {
  /** Stable persistence identity of the conversation that owns the failed turn. */
  conversationId: string;
  /** Original socket room; an empty string is a valid room-less subscription. */
  roomId: string;
  /** Original socket event/channel used by the failed harness turn. */
  event: string;
  /** Model selected for the failed harness turn. */
  model: string;
  /** Original context-size setting, when the turn supplied one. */
  numCtx?: string;
  /** Original reasoning setting, when the turn supplied one. */
  think?: string;
  /** Original streaming setting, when the turn supplied one. */
  stream?: boolean;
}
