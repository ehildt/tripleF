export interface MessageListItem {
  id?: string;
  role: string;
  content: string;
  included?: boolean;
  contextPercent?: string;
  /** True while this user prompt is selected for a merge (green). */
  mergeSelected?: boolean;
  /** True once this user prompt was consumed by a completed merge (purple). */
  merged?: boolean;
  /** Request id of the merge that consumed this item (red icon tooltip). */
  mergedRequestId?: string;
}
