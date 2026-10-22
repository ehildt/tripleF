import { Bell, ListVideo, PanelRight, PictureInPicture2 } from '@lucide/vue';
import { computed, ref } from 'vue';

import type { MenuTabItem } from '@/components/shared/ui/menu-tabs/MenuTabs.types';
import { i18n } from '@/i18n/i18n';

import type { WidgetId } from '../WidgetsSection.types';

/**
 * The Settings "Widgets" tab's submenu: which widget panel is active (the
 * video popout, the floating playlist, the toast notifications, or the
 * slide-out tab menu) and the submenu's labeled items. In-memory only —
 * reopening Settings starts on the first widget panel again.
 */
export function useWidgetPanel() {
  const activeWidget = ref<WidgetId>('videoPopout');

  const widgets = computed<MenuTabItem[]>(() => [
    {
      id: 'videoPopout',
      label: i18n.global.t('common.videoPopout'),
      icon: PictureInPicture2,
    },
    {
      id: 'playlist',
      label: i18n.global.t('common.floatingPlayer'),
      icon: ListVideo,
    },
    {
      id: 'toast',
      label: i18n.global.t('common.toastNotifications'),
      icon: Bell,
    },
    {
      id: 'tabMenu',
      label: i18n.global.t('common.tabMenuTitle'),
      icon: PanelRight,
    },
  ]);

  return { widgets, activeWidget };
}
