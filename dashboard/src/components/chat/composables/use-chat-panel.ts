import { nextTick, type Ref, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

/**
 * Manages the right-side panel view state (files vs history), including
 * the automatic switches that happen when the active conversation changes or
 * when the available content changes.
 */
export function useChatPanel(
  hasAttachments: Ref<boolean>,
  hasHistory: Ref<boolean>,
) {
  const conversationStore = useConversationStore();

  const rightPanelView = ref<'files' | 'history'>('files');

  watch(
    () => conversationStore.activeConversationId,
    async () => {
      await nextTick();
      if (hasAttachments.value) {
        rightPanelView.value = 'files';
      } else if (hasHistory.value) {
        rightPanelView.value = 'history';
      }
    },
    { immediate: true },
  );

  watch([hasAttachments, hasHistory], () => {
    const current = rightPanelView.value;
    if (current === 'files' && !hasAttachments.value) {
      if (hasHistory.value) rightPanelView.value = 'history';
    } else if (current === 'history' && !hasHistory.value) {
      if (hasAttachments.value) rightPanelView.value = 'files';
    }
  });

  function selectPanelView(view: 'files' | 'history') {
    rightPanelView.value = view;
  }

  return {
    rightPanelView,
    selectPanelView,
  };
}
