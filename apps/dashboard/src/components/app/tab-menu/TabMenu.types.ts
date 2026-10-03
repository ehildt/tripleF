import type { ActiveTab } from '../../../types/app.model';

/**
 * Props for the slide-out tab menu: the active destination, the numeric
 * debug-log counter, and the two attention badges (chat star, DLQ dot).
 */
export interface TabMenuProps {
  /** The currently active destination tab. */
  activeTab: ActiveTab;
  /** Number of unread debug-log entries shown on the debug tab. */
  debugCount: number;
  /** Show the chat "new response" star badge. */
  showChatStar?: boolean;
  /** Show the DLQ "changed since last opened" attention dot. */
  showDlqBadge?: boolean;
}
