import { computed } from 'vue';

import { useLeftToolbar } from '@/components/chat/chat-left-toolbar/composables/use-left-toolbar';
import { useLeftToolbarView } from '@/components/chat/chat-left-toolbar/tabs/composables/use-left-toolbar-view';
import { useBlink } from '@/composables/use-blink';

/**
 * Everything the prompt-menu needs: the model selector, the chat (new
 * conversation) menu, and the sockets (stream settings) menu that live on
 * the left of the prompt action bar.
 *
 * Composes the chat view's singletons by import — the left-toolbar state is
 * shared with the left toolbar itself (menu exclusivity spans both trees)
 * and the toolbar view is shared so opening a menu also selects the matching
 * list section. The trigger blink stays component-scope: hinting a disabled
 * trigger only matters while this menu strip is on screen.
 */
export function usePromptMenu() {
  const {
    isModelMenuOpen,
    isConversationMenuOpen,
    isStreamMenuOpen,
    closeAllMenus,
    toggleModelMenu,
    toggleConversationMenu,
    toggleStreamMenu,
    hasNoModelSelected,
    selectedModelName,
    localModels,
    cloudModels,
    modelsLoading,
    changeModel,
    newSubscriptionStreamEnabled,
    newSubscriptionEvent,
    newSubscriptionRoomId,
    subscribeToEvent,
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    availableSocketEvents,
    availableRooms,
    contextOptions,
    currentNumCtx,
    defaultNumCtx,
    selectNumCtx,
    createConversation,
    formatContextValue,
  } = useLeftToolbar();

  const { selectLeftToolbarView, areSocketsVisible } = useLeftToolbarView();

  const {
    isBlinking: triggerBlinking,
    start: startTriggerBlink,
    stop: stopTriggerBlink,
  } = useBlink();

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
    subscribeToEvent(
      newSubscriptionEvent.value,
      newSubscriptionRoomId.value,
      newSubscriptionStreamEnabled.value,
    );
    closeAllMenus();
  }

  return {
    areSocketsVisible,
    isModelMenuOpen,
    isConversationMenuOpen,
    isStreamMenuOpen,
    hasNoModelSelected,
    selectedModelName,
    localModels,
    cloudModels,
    modelsLoading,
    newSubscriptionStreamEnabled,
    newSubscriptionEvent,
    newSubscriptionRoomId,
    newConversationName,
    newConversationEvent,
    newConversationRoomId,
    numCtxValue,
    contextOptions,
    formatContextValue,
    availableSocketEvents,
    availableRooms,
    closeAllMenus,
    toggleModelMenu,
    toggleChatMenu,
    toggleSocketsMenu,
    selectNumCtx,
    selectModelAndCloseMenu,
    createConversationAndCloseMenu,
    subscribeToEventAndCloseMenu,
    triggerBlinking,
    startTriggerBlink,
    stopTriggerBlink,
  };
}
