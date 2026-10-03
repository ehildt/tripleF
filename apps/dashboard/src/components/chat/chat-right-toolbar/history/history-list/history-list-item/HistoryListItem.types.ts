import type { ChatIconVisibility } from '@/types/app.model';

import type { HistoryListItemData } from '../HistoryList.types';

export interface HistoryListItemProps {
  /** The history row to render. */
  item: HistoryListItemData;
  /** True for the currently-active row (marquee preview + accent ring). */
  active: boolean;
  /** Which action icons to show. Omitted keys default to visible. */
  iconVisibility?: Partial<ChatIconVisibility>;
  /** False when the conversation has fewer than two merge candidates —
   * the merge button grays out. */
  canMerge: boolean;
  /** True when at least two user prompts are selected — merge icon pulses. */
  mergeArmed: boolean;
}
