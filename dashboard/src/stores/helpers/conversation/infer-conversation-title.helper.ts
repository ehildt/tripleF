import { i18n } from '../../../i18n/i18n';

/**
 * A conversation still titled with the default placeholder adopts the first
 * 50 characters of its first exchange's content. Once the title was changed
 * (or the exchange has no content) it stays as-is. The placeholder is the
 * localized default title — evaluated at call time so a locale switch keeps
 * existing untitled chats eligible.
 */
export function inferConversationTitle(
  currentTitle: string,
  exchangeContent: string,
): string {
  const defaultTitle = i18n.global.t('common.newConversation');
  if (currentTitle !== defaultTitle) return currentTitle;
  return exchangeContent.slice(0, 50) || defaultTitle;
}
