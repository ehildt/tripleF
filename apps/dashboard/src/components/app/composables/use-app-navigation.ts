import { computed, watch } from 'vue';

import { useDlqActivity } from '@/components/dlq/composables/use-dlq-activity';
import { useWidgetPreview } from '@/components/widgets/shared/composables/use-widget-preview';
import { useNavigationStore } from '@/stores/app/navigation/navigation.store';

import { useActiveTab } from './use-active-tab';
import type { AppNavigationState } from './use-app-navigation.types';

/** Navigation-derived badges and transient-state dismissal for the app shell. */
export function useAppNavigation(): AppNavigationState {
  const { activeTab } = useActiveTab();
  const navigationStore = useNavigationStore();
  const dlqActivity = useDlqActivity();
  const widgetPreview = useWidgetPreview();

  const showDlqBadge = computed(
    () => dlqActivity.hasDlqActivity.value && activeTab.value !== 'dlq',
  );

  watch(activeTab, (tab) => {
    // Settings previews are transient: switching tabs dismisses them.
    widgetPreview.hideWidgetPreview();
    if (tab === 'chat') navigationStore.clearChatResponseActivity();
  });

  return { showDlqBadge };
}
