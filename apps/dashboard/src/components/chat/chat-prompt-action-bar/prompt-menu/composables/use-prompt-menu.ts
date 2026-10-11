import { computed } from 'vue';

import { useContextSize } from '@/components/chat/chat-left-toolbar/composables/use-context-size';
import { useLeftToolbarMenus } from '@/components/chat/chat-left-toolbar/composables/use-left-toolbar-menus';
import { useNewConversationForm } from '@/components/chat/chat-left-toolbar/composables/use-new-conversation-form';
import { useNewSocketForm } from '@/components/chat/chat-left-toolbar/composables/use-new-socket-form';
import { useSelectedModel } from '@/components/chat/chat-left-toolbar/composables/use-selected-model';
import { useLeftToolbarView } from '@/components/chat/chat-left-toolbar/tabs/composables/use-left-toolbar-view';

/**
 * The prompt-menu's composed behaviors: actions whose meaning spans several
 * of the menu strip's source composables (open-a-menu-also-selects-its-view,
 * act-then-close-menu) and the numCtx option fallback. The raw surfaces —
 * the toolbar menu state, the selected model, the context-size options, and
 * the socket and conversation forms — are bound by PromptMenu.vue directly
 * from their source composables; this composable
 * imports those singletons only to combine their members into new behavior,
 * never to re-export them.
 */
export function usePromptMenu() {
  const { closeAllMenus, toggleConversationMenu, toggleStreamMenu } =
    useLeftToolbarMenus();

  const { changeModel } = useSelectedModel();
  const { currentNumCtx, defaultNumCtx } = useContextSize();
  const { submitNewSocket } = useNewSocketForm();
  const { createConversation } = useNewConversationForm();
  const { selectLeftToolbarView } = useLeftToolbarView();

  /** The menu's option value falls back to the model's default context size
   *  while the active conversation has no numCtx of its own. */
  const numCtxValue = computed(
    () => currentNumCtx.value || defaultNumCtx.value,
  );

  /** The chat menu opens its section too, so the list shown in the left
   *  toolbar matches the menu's context (same behavior the plus had). */
  function toggleChatMenu() {
    selectLeftToolbarView('conversations');
    toggleConversationMenu();
  }

  function toggleSocketsMenu() {
    selectLeftToolbarView('sockets');
    toggleStreamMenu();
  }

  function createConversationAndCloseMenu(type: 'temporary' | 'persistent') {
    createConversation(type);
    closeAllMenus();
  }

  function selectModelAndCloseMenu(modelName: string) {
    changeModel(modelName);
    closeAllMenus();
  }

  function subscribeToEventAndCloseMenu() {
    submitNewSocket();
    closeAllMenus();
  }

  return {
    numCtxValue,
    toggleChatMenu,
    toggleSocketsMenu,
    selectModelAndCloseMenu,
    createConversationAndCloseMenu,
    subscribeToEventAndCloseMenu,
  };
}
