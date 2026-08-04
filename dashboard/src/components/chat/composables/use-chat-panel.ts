import { nextTick, type Ref, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import type { RightPanelView } from '../types/right-panel-view.type';
import { rightPanelViewState } from './right-panel-view.state';

export type { RightPanelView };

/**
 * Manages the right-side panel view state (files, playlist, or history),
 * including the automatic switches that happen when the active conversation
 * changes or when the available content changes.
 *
 * Tab follow-on-change: whenever a tab's content count changes (a video is
 * added to the playlist, a file is attached, a prompt lands in history),
 * the panel switches to that tab. Conversation switches rebase the counters
 * without triggering a follow — hydration is not a "change".
 */
export function useChatPanel(
  hasAttachments: Ref<boolean>,
  hasHistory: Ref<boolean>,
  hasPlaylist: Ref<boolean> = ref(false),
  playlistVideoCount: Ref<number> = ref(0),
  attachmentCount: Ref<number> = ref(0),
  historyItemCount: Ref<number> = ref(0),
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
      // Keep the player visible across a conversation switch as long as the
      // new conversation still has a playlist — don't bounce off to the files
      // tab just because the view priority changed. An empty new playlist
      // falls through to the next available tab.
      if (rightPanelView.value === 'playlist' && hasPlaylist.value) return;
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
   * Follow a change in one tab's content count into that tab. Count changes
   * that flush in the same tick as a conversation switch are the new
   * conversation's data loading, not user actions — those are skipped.
   */
  let conversationSwitchTick = false;
  watch(
    () => conversationStore.activeConversationId,
    async () => {
      conversationSwitchTick = true;
      await nextTick();
      conversationSwitchTick = false;
    },
  );

  function watchCountIntoView(count: Ref<number>, view: RightPanelView) {
    watch(count, (value, previous) => {
      if (conversationSwitchTick) return;
      // A removal that empties a tab must not navigate INTO it — the
      // availability fallback picks the next available tab instead.
      if (!isViewAvailable(view)) return;
      if (value !== (previous ?? 0)) rightPanelView.value = view;
    });
  }

  watchCountIntoView(playlistVideoCount, 'playlist');
  watchCountIntoView(attachmentCount, 'files');
  watchCountIntoView(historyItemCount, 'history');

  // Mirror the view for deep surfaces (floating popouts) that cannot
  // receive it as a prop.
  watch(
    rightPanelView,
    (view) => {
      rightPanelViewState.value = view;
    },
    { immediate: true },
  );

  function selectPanelView(view: RightPanelView) {
    rightPanelView.value = view;
  }

  return {
    rightPanelView,
    selectPanelView,
  };
}
