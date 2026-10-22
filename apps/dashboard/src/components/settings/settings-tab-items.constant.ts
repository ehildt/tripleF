import type { LucideIcon } from '@lucide/vue';
import {
  Blocks,
  Cog,
  Layers,
  LayoutTemplate,
  MemoryStick,
  MessagesSquare,
  Puzzle,
  ScanEye,
} from '@lucide/vue';

import type { SettingsTab } from './composables/use-settings-tab.types';

/**
 * The settings tabs in display order, with their icon and the i18n key of
 * their label (the label is translated by the consumer — constants stay
 * data, no runtime translation). Single source for the settings menu's
 * tab buttons and the panel header's active-tab title.
 */
export const SETTINGS_TAB_ITEMS: readonly {
  tab: SettingsTab;
  labelKey: string;
  icon: LucideIcon;
}[] = [
  {
    tab: 'integrations',
    labelKey: 'common.settingsIntegrations',
    icon: Puzzle,
  },
  {
    tab: 'preprocessing',
    labelKey: 'common.settingsPreprocessing',
    icon: ScanEye,
  },
  { tab: 'layouts', labelKey: 'common.settingsLayouts', icon: Layers },
  { tab: 'widgets', labelKey: 'common.settingsWidgets', icon: Blocks },
  {
    tab: 'chat',
    labelKey: 'common.settingsChatNavigation',
    icon: MessagesSquare,
  },
  {
    tab: 'interface',
    labelKey: 'common.settingsInterface',
    icon: LayoutTemplate,
  },
  { tab: 'memory', labelKey: 'common.settingsMemory', icon: MemoryStick },
  { tab: 'system', labelKey: 'common.settingsSystem', icon: Cog },
];
