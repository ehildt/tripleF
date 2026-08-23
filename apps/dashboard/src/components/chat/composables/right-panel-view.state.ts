import { computed, type Ref, ref } from 'vue';

import { isVideoInActivePlaylist } from '@/components/widgets/floating-playlist/composables/playlist.state';

import {
  floatingPlaylistOpen,
  playlistMode,
} from '../../widgets/floating-playlist/composables/playlist-settings.state';
import { activePlaybackVideoUrl } from '../exchange-list/chat-exchange/exchange-content/assistant-response/composables/video-playback.state';
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
 * marquee: the chat right panel's playlist tab when it is visible, or the
 * floating playlist window while it is open in floating mode — in both
 * cases only when a playlist item is actively playing. The floating
 * popouts animate their own title whenever this is false — the marquee
 * disappears from the popout only when the playlist bar would genuinely
 * show it.
 */
export const playlistMarqueeVisible = computed(() => {
  if (rightPanelViewState.value !== 'playlist') {
    if (playlistMode.value !== 'floating' || !floatingPlaylistOpen.value) {
      return false;
    }
  }
  const url = activePlaybackVideoUrl.value;
  if (!url) return false;
  return isVideoInActivePlaylist(url);
});
