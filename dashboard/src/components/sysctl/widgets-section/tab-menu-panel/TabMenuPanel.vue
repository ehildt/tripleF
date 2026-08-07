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
import CollapsiblePanel from '@/components/shared/ui/collapsible-panel/CollapsiblePanel.vue';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

import { useSysctlTabVisibility } from '../../composables/use-sysctl-tab-visibility';

const SIDE_OPTIONS = [
  { value: 'left', icon: PanelLeft, tooltip: i18n.global.t('common.left') },
  { value: 'right', icon: PanelRight, tooltip: i18n.global.t('common.right') },
] as const;

const { isTabVisible, toggleTab } = useSysctlTabVisibility();

function setSide(value: string) {
  setTabMenuSide(value as TabMenuSide);
}
</script>

<template>
  <PanelLayout class="tab-menu-panel">
    <CollapsiblePanel id="tabMenu" :title="$t('common.tabMenuTitle')">
      <template #actions>
        <ResetButton
          :title="$t('common.resetTabMenuSettingsToDefaults')"
          @click="resetTabMenuSettings"
        />
      </template>

      <div class="tab-menu-panel__content">
        <FieldCard
          :icon="SquareMenu"
          :label="$t('common.side')"
          :description="$t('common.sideDesc')"
        >
          <template #controls>
            <SegmentedToggle
              :options="SIDE_OPTIONS"
              :model-value="tabMenuSide"
              :aria-label="$t('common.menuSide')"
              @update:model-value="setSide"
            />
          </template>
        </FieldCard>

        <FieldCard
          :icon="X"
          :label="$t('common.autoclose')"
          :description="$t('common.tabMenuAutocloseDesc')"
          :checked="tabMenuAutoClose"
          @toggle="setTabMenuAutoClose(!tabMenuAutoClose)"
        />

        <div class="tab-menu-panel__tabs">
          <FieldCard
            :icon="MailX"
            :label="$t('common.dlqTab')"
            :description="$t('common.dlqTabDesc')"
            :checked="isTabVisible('dlq')"
            @toggle="toggleTab('dlq')"
          />

          <FieldCard
            :icon="Bug"
            :label="$t('common.debugTab')"
            :description="$t('common.debugTabDesc')"
            :checked="isTabVisible('debug')"
            @toggle="toggleTab('debug')"
          />
        </div>
      </div>
    </CollapsiblePanel>
  </PanelLayout>
</template>

<style scoped>
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
