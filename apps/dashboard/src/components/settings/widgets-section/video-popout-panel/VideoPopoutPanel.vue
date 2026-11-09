<script setup lang="ts">
/**
 * Video popout settings: where the floating video popout initially
 * appears, whether a moved position is remembered across conversations and
 * reloads, and whether the popout docks itself when its video is back in
 * view — plus a reset back to the defaults. Closing a popout always hides
 * the window and keeps playback running; the transport bar's Stop button
 * ends playback.
 *
 * Initial position is a SegmentedFieldCard with two icon-only segmented
 * toggles: vertical (top/middle/bottom) × horizontal (left/center/right),
 * covering every position in one line.
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowDownToLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Menu,
  PictureInPicture2,
  Pin,
  Power,
  RotateCcw,
  ScanSearch,
} from '@lucide/vue';
import { computed } from 'vue';

import MenuButton from '@/components/shared/ui/menu-button/MenuButton.vue';
import MenuRow from '@/components/shared/ui/menu-row/MenuRow.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SectionHeader from '@/components/shared/ui/section-header/SectionHeader.vue';
import type { SegmentedFieldCardToggle } from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.types';
import SegmentedFieldCard from '@/components/shared/ui/segmented-field-card/SegmentedFieldCard.vue';
import { useWidgetPreview } from '@/components/widgets/shared/composables/use-widget-preview';
import { i18n } from '@/i18n/i18n';
import { usePopoutSettingsStore } from '@/stores/popout-settings/popout-settings.store';
import type { PopoutAnchor } from '@/stores/popout-settings/popout-settings.types';

import type {
  PopoutHorizontal,
  PopoutVertical,
} from './VideoPopoutPanel.types';

const popoutSettingsStore = usePopoutSettingsStore();
const { popoutPreviewVisible, toggleWidgetPreview } = useWidgetPreview();

const VERTICAL_OPTIONS = computed(() => [
  { value: 'top', icon: ArrowUp, tooltip: i18n.global.t('common.top') },
  {
    value: 'middle',
    icon: AlignCenterVertical,
    tooltip: i18n.global.t('common.middle'),
  },
  { value: 'bottom', icon: ArrowDown, tooltip: i18n.global.t('common.bottom') },
]);

const HORIZONTAL_OPTIONS = computed(() => [
  { value: 'left', icon: ArrowLeft, tooltip: i18n.global.t('common.left') },
  {
    value: 'center',
    icon: AlignCenterHorizontal,
    tooltip: i18n.global.t('common.center'),
  },
  { value: 'right', icon: ArrowRight, tooltip: i18n.global.t('common.right') },
]);

const vertical = computed(
  () => popoutSettingsStore.popoutAnchor.split('-')[0] as PopoutVertical,
);
const horizontal = computed(
  () => popoutSettingsStore.popoutAnchor.split('-')[1] as PopoutHorizontal,
);

function setVertical(value: string): void {
  popoutSettingsStore.setPopoutAnchor(
    `${value}-${horizontal.value}` as PopoutAnchor,
  );
}

function setHorizontal(value: string): void {
  popoutSettingsStore.setPopoutAnchor(
    `${vertical.value}-${value}` as PopoutAnchor,
  );
}

const POSITION_TOGGLES = computed<readonly SegmentedFieldCardToggle[]>(() => [
  {
    key: 'vertical',
    ariaLabel: i18n.global.t('common.verticalPosition'),
    options: VERTICAL_OPTIONS.value,
    value: vertical.value,
    onSelect: setVertical,
  },
  {
    key: 'horizontal',
    ariaLabel: i18n.global.t('common.horizontalPosition'),
    options: HORIZONTAL_OPTIONS.value,
    value: horizontal.value,
    onSelect: setHorizontal,
  },
]);
</script>

<template>
  <div class="video-popout-panel">
    <MenuRow variant="panel" role="toolbar">
      <MenuButton
        :icon="ScanSearch"
        :label="
          popoutPreviewVisible
            ? $t('common.hideExamplePopout')
            : $t('common.showExamplePopout')
        "
        :active="popoutPreviewVisible"
        @click="toggleWidgetPreview('popout')"
      />
      <MenuButton
        :icon="RotateCcw"
        :label="$t('common.resetPopoutSettingsToDefaults')"
        @click="popoutSettingsStore.resetPopoutSettings"
      />
      <MenuButton
        :icon="Power"
        :label="$t('common.enableVideoPopout')"
        :active="popoutSettingsStore.popoutEnabled"
        @click="
          popoutSettingsStore.setPopoutEnabled(
            !popoutSettingsStore.popoutEnabled,
          )
        "
      />
    </MenuRow>

    <div class="video-popout-panel__group">
      <SectionHeader
        :icon="PictureInPicture2"
        :title="$t('common.positionSection')"
      />
      <div class="video-popout-panel__grid">
        <!-- Initial position + remember position side by side -->
        <SegmentedFieldCard
          :icon="PictureInPicture2"
          :label="$t('common.initialPosition')"
          :description="$t('common.popoutPositionDesc')"
          :toggles="POSITION_TOGGLES"
          :disabled="!popoutSettingsStore.popoutEnabled"
        />

        <NumberFieldCard
          :icon="Pin"
          :label="$t('common.rememberPosition')"
          :description="$t('common.rememberPositionDesc')"
          :checked="popoutSettingsStore.popoutRememberPosition"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutRememberPosition(
              !popoutSettingsStore.popoutRememberPosition,
            )
          "
        />
      </div>
    </div>

    <div class="video-popout-panel__group">
      <SectionHeader
        :icon="ArrowDownToLine"
        :title="$t('common.behaviorSection')"
      />
      <div class="video-popout-panel__grid">
        <NumberFieldCard
          :icon="ArrowDownToLine"
          :label="$t('common.autodock')"
          :description="$t('common.autodockDesc')"
          :checked="popoutSettingsStore.popoutAutoDock"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutAutoDock(
              !popoutSettingsStore.popoutAutoDock,
            )
          "
        />

        <NumberFieldCard
          :icon="Menu"
          :label="$t('common.alwaysShowBar')"
          :description="$t('common.alwaysShowBarDesc')"
          :checked="popoutSettingsStore.popoutShowBarAlways"
          :disabled="!popoutSettingsStore.popoutEnabled"
          @toggle="
            popoutSettingsStore.setPopoutShowBarAlways(
              !popoutSettingsStore.popoutShowBarAlways,
            )
          "
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.video-popout-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.video-popout-panel__group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.video-popout-panel__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-2);
}
</style>
