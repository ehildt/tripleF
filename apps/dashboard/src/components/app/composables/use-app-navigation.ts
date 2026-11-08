import { computed, watch } from 'vue';

import { useDlqActivity } from '@/components/dlq/composables/use-dlq-activity';
import { useNavigationStore } from '@/stores/app/navigation/navigation.store';
import { usePlaylistStore } from '@/stores/playlist/playlist.store';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';

import { useActiveTab } from './use-active-tab';

/** Navigation-derived badges and transient-state dismissal for the app shell. */
export function useAppNavigation() {
  const { activeTab } = useActiveTab();
  const navigationStore = useNavigationStore();
  const dlqActivity = useDlqActivity();
  const popoutSettingsStore = usePopoutSettingsStore();
  const playlistStore = usePlaylistStore();

  const showDlqBadge = computed(
    () => dlqActivity.hasDlqActivity.value && activeTab.value !== 'dlq',
  );

  watch(activeTab, (tab) => {
    // Settings previews are transient: switching tabs dismisses them.
    popoutSettingsStore.hidePopoutPreview();
    playlistStore.hidePlaylistPreview();
    if (tab === 'chat') navigationStore.clearChatResponseActivity();
  });

  return { showDlqBadge };
}
