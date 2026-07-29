import { computed, type Ref, ref } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import {
  activePlaybackVideoUrl,
  isPlaylistVideo,
} from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
import type { RightPanelView } from '../types/right-panel-view.type';

/**
 * Read-only mirror of the right panel's active view, synced by
 * useChatPanel (the owner). Deep video surfaces — the floating popouts —
 * read it to decide who carries the animated now-playing text without
 * needing the view drilled down as props.
 */
export const rightPanelViewState: Ref<RightPanelView> = ref('files');

/**
 * Whether the playlist bar currently carries the scrolling now-playing
 * marquee: only while the playlist tab is visible AND a playlist item is
 * actively playing. The floating popouts animate their own title whenever
 * this is false — the marquee disappears from the popout only when the
 * playlist bar would genuinely show it.
 */
export const playlistMarqueeVisible = computed(() => {
  if (rightPanelViewState.value !== 'playlist') return false;
  const url = activePlaybackVideoUrl.value;
  if (!url) return false;
  const conversationId = useConversationStore().activeConversationId ?? '';
  return isPlaylistVideo(conversationId, url);
});
