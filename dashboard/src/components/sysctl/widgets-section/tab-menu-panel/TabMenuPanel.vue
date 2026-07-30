<script setup lang="ts">
/**
 * Tab menu settings: which screen edge the slide-out menu is docked to,
 * whether it closes itself after a tab pick or an outside click, and which
 * optional tabs (dlq, debug) show up in the drawer — plus a reset back to
 * the defaults.
 *
 * Mirrors the other widget panels: an icon-only segmented toggle for the
 * side (same pattern as the other initial positions), checkbox FieldCards
 * for autoclose and the optional tabs, and a reset action in the title
 * bar. The menu is the app navigation, so there is no enable/disable
 * power toggle.
 */
import { Bug, MailX, PanelLeft, PanelRight, SquareMenu, X } from '@lucide/vue';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
  tabMenuAutoClose,
  type TabMenuSide,
  tabMenuSide,
} from '@/components/app/tab-menu/composables/tab-menu-settings.state';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';

import { useSysctlTabVisibility } from '../../composables/use-sysctl-tab-visibility';

const SIDE_OPTIONS = [
  { value: 'left', icon: PanelLeft, tooltip: 'Left' },
  { value: 'right', icon: PanelRight, tooltip: 'Right' },
] as const;

const { isTabVisible, toggleTab } = useSysctlTabVisibility();

function setSide(value: string) {
  setTabMenuSide(value as TabMenuSide);
}
</script>

<template>
  <div class="tab-menu-panel panel-glow">
    <PanelTitleBar title="Tab Menu">
      <template #actions>
        <ResetButton
          title="Reset tab menu settings to defaults"
          @click="resetTabMenuSettings"
        />
      </template>
    </PanelTitleBar>

    <div class="tab-menu-panel__content">
      <FieldCard
        :icon="SquareMenu"
        label="side"
        description="screen edge the slide-out menu is docked to"
      >
        <template #controls>
          <SegmentedToggle
            :options="SIDE_OPTIONS"
            :model-value="tabMenuSide"
            aria-label="Menu side"
            @update:model-value="setSide"
          />
        </template>
      </FieldCard>

      <FieldCard
        :icon="X"
        label="autoclose"
        description="close the menu after picking a tab or clicking outside — off keeps it toggled by hand"
        :checked="tabMenuAutoClose"
        @toggle="setTabMenuAutoClose(!tabMenuAutoClose)"
      />

      <div class="tab-menu-panel__tabs">
        <FieldCard
          :icon="MailX"
          label="dlq"
          description="dead letter queue tab"
          :checked="isTabVisible('dlq')"
          @toggle="toggleTab('dlq')"
        />

        <FieldCard
          :icon="Bug"
          label="debug"
          description="debug tab / logging"
          :checked="isTabVisible('debug')"
          @toggle="toggleTab('debug')"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-menu-panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.tab-menu-panel__content {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

@media (max-width: 40rem) {
  .tab-menu-panel__content {
    grid-template-columns: minmax(0, 1fr);
  }
}

.tab-menu-panel__tabs {
  grid-column: 1 / -1;
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
