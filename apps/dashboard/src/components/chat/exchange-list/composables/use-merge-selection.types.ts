import type { Exchange } from '@/stores/conversation';

export interface UseMergeSelection {
  /** True when the exchange (or its paired partner) is selected for merge. */
  isMergeSelected(conversationId: string, exchangeId: string): boolean;
  /** Toggle the exchange together with its paired user/assistant partner. */
  toggleMergeSelection(conversationId: string, exchangeId: string): void;
  /** Drop all merge selection for the conversation. */
  clearMergeSelection(conversationId: string): void;
  /** True when the conversation holds at least two completed user prompts —
   * a merge needs 2+ sources; merge icons gray out below that. */
  hasMergeCandidates(conversationId: string): boolean;
  /** True when at least two user prompts are selected — merge icons pulse. */
  isMergeArmed(conversationId: string): boolean;
  /** Selected exchange ids (both roles of each pair). */
  selectedExchangeIds(conversationId: string): string[];
  /** Selected exchanges in chronological conversation order. */
  selectedExchanges(conversationId: string): Exchange[];
  /** Request ids of the selected user exchanges, chronological & deduped. */
  selectedRequestIds(conversationId: string): string[];
}
