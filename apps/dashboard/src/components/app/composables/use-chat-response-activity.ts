import { useNavigationStore } from '@/stores/app/navigation/navigation.store';

import { useActiveTab } from './use-active-tab';

/** Mark chat attention only for responses arriving while Chat is inactive. */
export function useChatResponseActivity() {
  const { activeTab } = useActiveTab();
  const navigationStore = useNavigationStore();

  function notifyChatResponse(): void {
    if (activeTab.value !== 'chat') {
      navigationStore.markChatResponseActivity();
    }
  }

  return { notifyChatResponse };
}
