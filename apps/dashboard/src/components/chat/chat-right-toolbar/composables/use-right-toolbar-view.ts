import { ref, watch } from 'vue';

import { useChatConversation } from '@/components/chat/composables/use-chat-conversation';
import { usePlaybackSession } from '@/composables/use-playback-session';

import { useHistoryAvailability } from '../history/composables/use-history-availability';
import { usePlaylistTab } from '../playlist/composables/use-playlist-tab';
import type { RightToolbarView } from '../right-toolbar-view.type';
import { useAttachmentList } from './use-attachment-list';

/**
 * Owns the chat right toolbar's active section (files, playlist, or history).
 * Switching is manual: an explicit click sticks for the active conversation's
 * lifetime, and the only automatic move is picking the first available
 * section when the conversation changes (or, before any click, as the first
 * content lands in a brand-new conversation). The docked-playlist visibility
 * flag is shared data, so it is projected into the playback session for the
 * floating player's marquee; everything else stays component-scoped here.
 *
 * Composes its dependencies by import — the active conversation, the
 * per-section content flags, and the playback session.
 */
export function useRightToolbarView() {
  const playback = usePlaybackSession();
  const { conversationId: activeConversationId } = useChatConversation();
  const { hasAttachments } = useAttachmentList();
  const { hasPlaylist } = usePlaylistTab();
  const { hasHistory } = useHistoryAvailability();

  const rightToolbarView = ref<RightToolbarView>('history');

  /** The single write path: keep the local view and its projection in lockstep
   * so the floating-player marquee can never read a stale flag. */
  function applyView(view: RightToolbarView) {
    rightToolbarView.value = view;
    playback.setDockedPlaylistPanelVisible(view === 'playlist');
  }

  function isViewAvailable(view: RightToolbarView): boolean {
    if (view === 'files') return hasAttachments.value;
    if (view === 'playlist') return hasPlaylist.value;
    return hasHistory.value;
  }

  /** Pick the highest-priority view that currently has content. */
  function firstAvailableView(): RightToolbarView {
    if (hasAttachments.value) return 'files';
    if (hasPlaylist.value) return 'playlist';
    return 'history';
  }

  /** Set on an explicit tab click and cleared when the conversation changes.
   * While set, auto-pick never moves the view — an emptied section simply
   * shows its empty panel. */
  let userSelectedView: RightToolbarView | null = null;

  // Auto-pick the initial tab only when the active conversation changes. Runs
  // immediately so a restored conversation picks its first available section
  // at setup.
  watch(
    activeConversationId,
    () => {
      userSelectedView = null;
      applyView(firstAvailableView());
    },
    { immediate: true },
  );

  // Before the user has chosen, keep the auto-picked view on an available
  // section as content arrives within a brand-new conversation (e.g. the
  // first attachment after the conversation is created). After an explicit
  // click this watcher is a no-op: the selection sticks for the conversation.
  watch([hasAttachments, hasPlaylist, hasHistory], () => {
    if (userSelectedView !== null) return;
    if (isViewAvailable(rightToolbarView.value)) return;
    applyView(firstAvailableView());
  });

  function selectView(view: RightToolbarView) {
    userSelectedView = view;
    applyView(view);
  }

  return {
    rightToolbarView,
    selectView,
  };
}
