/**
 * Wire-level filter for every `DELETE /api/v1/memory/text` call — partition
 * and cognition lanes share the endpoint (the cognition lane is the flag
 * plus a cognition space key in `memoryPartition`), and both delete call
 * sites serialize through the build-delete-filter-query helper.
 */
export interface DeleteTextFilter {
  /** Partition scope, or the cognition space key when `cognition` is set. */
  memoryPartition: string;
  /** Cognition lane flag — serialized as `cognition=true` when set. */
  cognition?: boolean;
  /** Restrict to one partition session. */
  sessionId?: string;
  /** Restrict to one conversation. */
  conversationId?: string;
  /** Restrict to records created by one request/turn. */
  requestId?: string;
  /** Exact text match. */
  text?: string;
  /** Full-text containment on the record text. */
  contains?: string;
  /** Tag filter (any-match, CSV-serialized). */
  tags?: string[];
  /** Profile routing path (cognition lane). */
  path?: string;
}
