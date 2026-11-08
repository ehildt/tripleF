import type { ChatIconVisibility } from './chat-navigation-settings.model';

export const SCROLL_MODE_KEY = 'harness-scroll-mode';
export const CONVERSATION_SCROLL_MODE_KEY = 'harness-conv-scroll-mode';
export const CHAT_ICON_VISIBILITY_KEY = 'harness-chat-icon-visibility';

/** Chat icon visibility defaults — everything on until the user toggles. */
export const DEFAULT_CHAT_ICON_VISIBILITY: ChatIconVisibility = {
  copy: true,
  include: true,
  branch: true,
  delete: true,
};
