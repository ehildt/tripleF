<script setup lang="ts">
/**
 * Tab menu settings: which screen edge the slide-out menu is docked to,
 * whether it closes itself after a tab pick or an outside click, and which
 * optional tabs (memory, dlq, debug) show up in the drawer — plus the unread
 * count badges and a reset back to the defaults.
 *
 * Mirrors the other widget panels: an icon-only segmented toggle for the
 * side (same pattern as the other initial positions), checkbox FieldCards
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
  SquareMenu,
  X,
} from '@lucide/vue';
import { computed } from 'vue';

import {
  resetTabMenuSettings,
  setTabMenuAutoClose,
  setTabMenuSide,
  tabMenuAutoClose,
  tabMenuSide,
} from '@/components/app/tab-menu/composables/tab-menu-settings.state';
import type { TabMenuSide } from '@/components/app/tab-menu/composables/tab-menu-settings.state.types';
import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import { i18n } from '@/i18n/i18n';

import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';
import { useSysctlTabVisibility } from '../../composables/use-sysctl-tab-visibility';

const SIDE_OPTIONS = computed(() => [
  { value: 'left', icon: PanelLeft, tooltip: i18n.global.t('common.left') },
  { value: 'right', icon: PanelRight, tooltip: i18n.global.t('common.right') },
]);

const { isTabVisible, toggleTab, showCounters, toggleShowCounters } =
  useSysctlTabVisibility();

function setSide(value: string) {
  setTabMenuSide(value as TabMenuSide);
}
</script>

<template>
  <div class="tab-menu-panel">
    <div class="tab-menu-panel__actions">
      <ResetButton
        :title="$t('common.resetTabMenuSettingsToDefaults')"
        @click="resetTabMenuSettings"
      />
    </div>

    <div class="tab-menu-panel__group">
      <SectionHeader :icon="SquareMenu" :title="$t('common.tabMenuSection')" />
      <div class="tab-menu-panel__grid">
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
      </div>
    </div>

    <div class="tab-menu-panel__group">
      <SectionHeader
        :icon="PanelTop"
        :title="$t('common.tabMenuTabsSection')"
      />
      <div class="tab-menu-panel__tabs">
        <FieldCard
          :icon="Brain"
          :label="$t('common.memoryTab')"
          :description="$t('common.memoryTabDesc')"
          :checked="isTabVisible('memory')"
          @toggle="toggleTab('memory')"
        />

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

        <FieldCard
          :icon="Hash"
          :label="$t('common.counters')"
          :description="$t('common.countersDesc')"
          :checked="showCounters"
          @toggle="toggleShowCounters"
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
  padding: var(--spacing-2);
}

.tab-menu-panel__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--spacing-1);
  min-height: calc(2.25rem + 2 * var(--spacing-2));
  padding: 0 var(--spacing-3);
  background:
    radial-gradient(
      ellipse 120% 140% at 12% 50%,
      color-mix(in srgb, var(--color-accent-primary) 18%, transparent) 0%,
      transparent 60%
    ),
    radial-gradient(
      ellipse 120% 140% at 88% 50%,
      color-mix(in srgb, var(--color-accent-secondary) 14%, transparent) 0%,
      transparent 60%
    ),
    var(--color-bg-elevated);
}

.tab-menu-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
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
