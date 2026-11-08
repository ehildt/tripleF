/** How a conversation's exchange list is scrolled: the full-page vertical
 * carousel (crossfading sections) or the native continuous scroll list. */
export type ScrollMode = 'carousel' | 'native';

/** Which action icons are shown on the user-prompt header and the history
 * items. Each can be toggled from the Settings chat-navigation tab. */
export interface ChatIconVisibility {
  /** Show the copy action. */
  copy: boolean;
  /** Show the include/exclude action. */
  include: boolean;
  /** Show the branch action. */
  branch: boolean;
  /** Show the delete action. */
  delete: boolean;
}

/** Action-icon keys accepted by the visibility setter. */
export type ChatIconKey = keyof ChatIconVisibility;
