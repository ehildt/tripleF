import { nextTick, type Ref, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

export type RightPanelView = 'files' | 'playlist' | 'history';

/**
 * Manages the right-side panel view state (files, playlist, or history),
 * including the automatic switches that happen when the active conversation
 * changes or when the available content changes.
 */
export function useChatPanel(
  hasAttachments: Ref<boolean>,
  hasHistory: Ref<boolean>,
  hasPlaylist: Ref<boolean> = ref(false),
  playlistVideoCount: Ref<number> = ref(0),
) {
  const conversationStore = useConversationStore();

  const rightPanelView = ref<RightPanelView>('files');

  /** Pick the highest-priority view that currently has content. */
  function firstAvailableView(): RightPanelView {
    if (hasAttachments.value) return 'files';
    if (hasPlaylist.value) return 'playlist';
    return 'history';
  }

  function isViewAvailable(view: RightPanelView): boolean {
    if (view === 'files') return hasAttachments.value;
    if (view === 'playlist') return hasPlaylist.value;
    return hasHistory.value;
  }

  watch(
    () => conversationStore.activeConversationId,
    async () => {
      await nextTick();
      rightPanelView.value = firstAvailableView();
    },
    { immediate: true },
  );

  watch([hasAttachments, hasHistory, hasPlaylist], () => {
    if (!isViewAvailable(rightPanelView.value)) {
      rightPanelView.value = firstAvailableView();
    }
  });

  /**
   * Follow an explicit add into the playlist view. Conversation switches
   * rebase the count without triggering this — they pick the first
   * available view via the watcher above instead.
   */
  const lastCountConversationId = ref<string | null>(null);
  watch(playlistVideoCount, (count, previousCount) => {
    const conversationId = conversationStore.activeConversationId;
    if (conversationId !== lastCountConversationId.value) {
      lastCountConversationId.value = conversationId;
      return;
    }
    if (count > (previousCount ?? 0)) rightPanelView.value = 'playlist';
  });

  function selectPanelView(view: RightPanelView) {
    rightPanelView.value = view;
  }

  return {
    rightPanelView,
    selectPanelView,
  };
}
