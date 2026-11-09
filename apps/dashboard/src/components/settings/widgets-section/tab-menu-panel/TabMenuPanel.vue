<script setup lang="ts">
/**
 * Tab menu settings: which screen edge the slide-out menu is docked to,
 * whether it closes itself after a tab pick or an outside click, and which
 * optional tabs (memory, dlq, debug) show up in the drawer — plus the unread
 * count badges and a reset back to the defaults.
 *
 * Mirrors the other widget panels: an icon-only segmented toggle for the
 * side (same pattern as the other initial positions), checkbox NumberFieldCards
 * for autoclose and the optional tabs, and a reset action in the title
 * bar. The menu is the app navigation, so there is no enable/disable
 * power toggle.
 */
import {
  Brain,
  Bug,
  Hash,
  MailX,
  PanelLeft,
  PanelRight,
  PanelTop,
  RotateCcw,
  SquareMenu,
  X,
} from '@lucide/vue';
import { computed } from 'vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import type { SegmentedFieldCardToggle } from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.types';
import SegmentedFieldCard from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.vue';
import { i18n } from '@/i18n/i18n';
import { useNavigationStore } from '@/stores/app/navigation/navigation.store';
import { useTabMenuSettingsStore } from '@/stores/widgets/tab-menu-settings/tab-menu-settings.store';
import type { TabMenuSide } from '@/stores/widgets/tab-menu-settings/tab-menu-settings.types';

import { useSettingsTabVisibility } from '../../composables/use-settings-tab-visibility';

const tabMenuSettingsStore = useTabMenuSettingsStore();

const SIDE_OPTIONS = computed(() => [
  { value: 'left', icon: PanelLeft, tooltip: i18n.global.t('common.left') },
  { value: 'right', icon: PanelRight, tooltip: i18n.global.t('common.right') },
]);

const navigationStore = useNavigationStore();
const { toggleTab } = useSettingsTabVisibility();

function setSide(value: string) {
  tabMenuSettingsStore.setTabMenuSide(value as TabMenuSide);
}

const SIDE_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(() => [
  {
    key: 'menu-side',
    ariaLabel: i18n.global.t('common.menuSide'),
    options: SIDE_OPTIONS.value,
    value: tabMenuSettingsStore.tabMenuSide,
    onSelect: setSide,
  },
]);
</script>

<template>
  <div class="tab-menu-panel">
    <MenuRow variant="panel" role="toolbar">
      <MenuButton
        :icon="RotateCcw"
        :label="$t('common.resetTabMenuSettingsToDefaults')"
        @click="tabMenuSettingsStore.resetTabMenuSettings"
      />
    </MenuRow>

    <div class="tab-menu-panel__group">
      <SectionHeader :icon="SquareMenu" :title="$t('common.tabMenuSection')" />
      <div class="tab-menu-panel__grid">
        <SegmentedFieldCard
          :icon="SquareMenu"
          :label="$t('common.side')"
          :description="$t('common.sideDesc')"
          :toggles="SIDE_TOGGLES"
        />

        <NumberFieldCard
          :icon="X"
          :label="$t('common.autoclose')"
          :description="$t('common.tabMenuAutocloseDesc')"
          :checked="tabMenuSettingsStore.tabMenuAutoClose"
          @toggle="
            tabMenuSettingsStore.setTabMenuAutoClose(
              !tabMenuSettingsStore.tabMenuAutoClose,
            )
          "
        />
      </div>
    </div>

    <div class="tab-menu-panel__group">
      <SectionHeader
        :icon="PanelTop"
        :title="$t('common.tabMenuTabsSection')"
      />
      <div class="tab-menu-panel__tabs">
        <NumberFieldCard
          :icon="Brain"
          :label="$t('common.memoryTab')"
          :description="$t('common.memoryTabDesc')"
          :checked="navigationStore.isTabVisible('memory')"
          @toggle="toggleTab('memory')"
        />

        <NumberFieldCard
          :icon="MailX"
          :label="$t('common.dlqTab')"
          :description="$t('common.dlqTabDesc')"
          :checked="navigationStore.isTabVisible('dlq')"
          @toggle="toggleTab('dlq')"
        />

        <NumberFieldCard
          :icon="Bug"
          :label="$t('common.debugTab')"
          :description="$t('common.debugTabDesc')"
          :checked="navigationStore.isTabVisible('debug')"
          @toggle="toggleTab('debug')"
        />

        <NumberFieldCard
          :icon="Hash"
          :label="$t('common.counters')"
          :description="$t('common.countersDesc')"
          :checked="navigationStore.showCounters"
          @toggle="navigationStore.toggleShowCounters"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-menu-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.tab-menu-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.tab-menu-panel__grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--spacing-1);
}

@media (max-width: 40rem) {
  .tab-menu-panel__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tab-menu-panel__tabs {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-1);
}

@media (max-width: 40rem) {
  .tab-menu-panel__tabs {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
