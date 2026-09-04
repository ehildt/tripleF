<script setup lang="ts">
/**
 * The section tab bar of the Settings panel: one icon per settings group
 * (integrations, preprocessing, layouts, widgets, chat navigation,
 * interface, memory, system).
 */
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
import { computed } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import { i18n } from '@/i18n/i18n';

import MotionIcon from '../../shared/ui/motion-icon/MotionIcon.vue';
import type { SettingsTab } from '../composables/use-settings-tab.types';

defineProps<{
  activeTab: SettingsTab;
}>();

const emit = defineEmits<{
  selectTab: [tab: SettingsTab];
}>();

const TAB_LABELS = computed<
  { tab: SettingsTab; label: string; icon: typeof Cog }[]
>(() => [
  {
    tab: 'integrations',
    label: i18n.global.t('common.settingsIntegrations'),
    icon: Puzzle,
  },
  {
    tab: 'preprocessing',
    label: i18n.global.t('common.settingsPreprocessing'),
    icon: ScanEye,
  },
  {
    tab: 'layouts',
    label: i18n.global.t('common.settingsLayouts'),
    icon: Layers,
  },
  {
    tab: 'widgets',
    label: i18n.global.t('common.settingsWidgets'),
    icon: Blocks,
  },
  {
    tab: 'chat',
    label: i18n.global.t('common.settingsChatNavigation'),
    icon: MessagesSquare,
  },
  {
    tab: 'interface',
    label: i18n.global.t('common.settingsInterface'),
    icon: LayoutTemplate,
  },
  {
    tab: 'memory',
    label: i18n.global.t('common.settingsMemory'),
    icon: MemoryStick,
  },
  { tab: 'system', label: i18n.global.t('common.settingsSystem'), icon: Cog },
]);
</script>

<template>
  <div class="settings-menu" role="tablist">
    <Tooltip
      v-for="{ tab, label, icon } in TAB_LABELS"
      :key="tab"
      :text="label"
    >
      <button
        type="button"
        role="tab"
        :aria-label="label"
        :aria-selected="activeTab === tab"
        class="settings-menu__tab"
        :class="{ 'settings-menu__tab--active': activeTab === tab }"
        @click="emit('selectTab', tab)"
      >
        <MotionIcon>
          <component :is="icon" class="settings-menu__tab-icon" />
        </MotionIcon>
      </button>
    </Tooltip>
  </div>
</template>

<style scoped>
.settings-menu {
  display: flex;
  gap: var(--spacing-1);
  flex-wrap: wrap;
}

.settings-menu__tab {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  padding: 0;
  border: none;
  color: var(--color-fg-muted);
  background-color: transparent;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  border-radius: var(--spacing-1);
}

.settings-menu__tab:hover {
  color: var(--color-fg-primary);
}

.settings-menu__tab--active,
.settings-menu__tab--active:hover {
  color: var(--color-accent-primary);
}

.settings-menu__tab:focus {
  outline: none;
}

.settings-menu__tab:focus-visible {
  outline: 1px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.settings-menu__tab-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
</style>
