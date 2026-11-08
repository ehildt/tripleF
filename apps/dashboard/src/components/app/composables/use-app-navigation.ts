import { computed, watch } from 'vue';

import { useNavigationStore } from '@/stores/app/navigation/navigation.store';
import { useDlqStore } from '@/stores/dlq/dlq.store';
import { usePlaylistStore } from '@/stores/playlist/playlist.store';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';

import { useActiveTab } from './use-active-tab';

/** Navigation-derived badges and transient-state dismissal for the app shell. */
export function useAppNavigation() {
  const { activeTab } = useActiveTab();
  const navigationStore = useNavigationStore();
  const dlqStore = useDlqStore();
  const popoutSettingsStore = usePopoutSettingsStore();
  const playlistStore = usePlaylistStore();

  const showDlqBadge = computed(
    () => dlqStore.hasDlqActivity && activeTab.value !== 'dlq',
  );

  watch(activeTab, (tab) => {
    // Settings previews are transient: switching tabs dismisses them.
    popoutSettingsStore.hidePopoutPreview();
    playlistStore.hidePlaylistPreview();
    if (tab === 'chat') navigationStore.clearChatResponseActivity();
  });

  return { showDlqBadge };
}
