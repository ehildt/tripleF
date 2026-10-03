import type { ChatIconVisibility } from '@/types/app.model';

/** One history row: a user prompt plus its context/merge state. */
export interface HistoryListItemData {
  /** Exchange id — the row key and the active-row match target. */
  id?: string;
  /** Message role (always "user" for history rows). */
  role: string;
  /** Raw prompt text (markdown source). */
  content: string;
  /** False when the prompt (and its reply) are excluded from context. */
  included?: boolean;
  /** Formatted percent of the context window this turn used. */
  contextPercent?: string;
  /** True while this prompt is selected for a merge (green). */
  mergeSelected?: boolean;
  /** True once this prompt was consumed by a completed merge (purple). */
  merged?: boolean;
  /** Request id of the merge that consumed this row (red tooltip). */
  mergedRequestId?: string;
}

export interface HistoryListProps {
  /** The mapped history rows, in conversation order. */
  items: HistoryListItemData[];
  /** Id of the row to highlight as the currently-active one. */
  activeId?: string | null;
  /** Which action icons to show. Omitted keys default to visible. */
  iconVisibility?: Partial<ChatIconVisibility>;
  /** False when the conversation has fewer than two merge candidates —
   * the merge button grays out. */
  canMerge?: boolean;
  /** True when at least two user prompts are selected — merge icons pulse. */
  mergeArmed?: boolean;
}
