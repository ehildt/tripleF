<script setup lang="ts">
/**
 * Video popout settings: where the floating video popout initially
 * appears, whether a moved position is remembered across conversations and
 * reloads, and whether the popout docks itself when its video is back in
 * view — plus a reset back to the defaults. Closing a popout always hides
 * the window and keeps playback running; the transport bar's Stop button
 * ends playback.
 *
 * Initial position is a FieldCard row with two icon-only segmented
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
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';

import {
  type PopoutAnchor,
  popoutAnchor,
  popoutAutoDock,
  popoutEnabled,
  popoutPreviewVisible,
  popoutRememberPosition,
  popoutShowBarAlways,
  resetPopoutSettings,
  setPopoutAnchor,
  setPopoutAutoDock,
  setPopoutEnabled,
  setPopoutRememberPosition,
  setPopoutShowBarAlways,
  togglePopoutPreview,
} from '../../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';

type PopoutVertical = 'top' | 'middle' | 'bottom';
type PopoutHorizontal = 'left' | 'center' | 'right';

const VERTICAL_OPTIONS = [
  { value: 'top', icon: ArrowUp, tooltip: 'Top' },
  { value: 'middle', icon: AlignCenterVertical, tooltip: 'Middle' },
  { value: 'bottom', icon: ArrowDown, tooltip: 'Bottom' },
] as const;

const HORIZONTAL_OPTIONS = [
  { value: 'left', icon: ArrowLeft, tooltip: 'Left' },
  { value: 'center', icon: AlignCenterHorizontal, tooltip: 'Center' },
  { value: 'right', icon: ArrowRight, tooltip: 'Right' },
] as const;

const vertical = computed(
  () => popoutAnchor.value.split('-')[0] as PopoutVertical,
);
const horizontal = computed(
  () => popoutAnchor.value.split('-')[1] as PopoutHorizontal,
);

function setVertical(value: string) {
  setPopoutAnchor(`${value}-${horizontal.value}` as PopoutAnchor);
}

function setHorizontal(value: string) {
  setPopoutAnchor(`${vertical.value}-${value}` as PopoutAnchor);
}
</script>

<template>
  <div class="video-popout-panel panel-glow">
    <PanelTitleBar title="Video Popout">
      <template #actions>
        <PreviewButton
          :active="popoutPreviewVisible"
          :title="
            popoutPreviewVisible
              ? 'Hide example popout'
              : 'Show an example popout'
          "
          @click="togglePopoutPreview"
        />
        <ResetButton
          title="Reset popout settings to defaults"
          @click="resetPopoutSettings"
        />
        <PowerToggle
          :enabled="popoutEnabled"
          title="Enable video popout"
          @toggle="setPopoutEnabled(!popoutEnabled)"
        />
      </template>
    </PanelTitleBar>

    <div class="video-popout-panel__content">
      <!-- Initial position + remember position side by side -->
      <FieldCard
        :icon="PictureInPicture2"
        label="initial position"
        description="where the popout first appears"
        :disabled="!popoutEnabled"
      >
        <template #controls>
          <SegmentedToggle
            :options="VERTICAL_OPTIONS"
            :model-value="vertical"
            aria-label="Vertical position"
            @update:model-value="setVertical"
          />
          <SegmentedToggle
            :options="HORIZONTAL_OPTIONS"
            :model-value="horizontal"
            aria-label="Horizontal position"
            @update:model-value="setHorizontal"
          />
        </template>
      </FieldCard>

      <FieldCard
        :icon="Pin"
        label="remember position"
        description="keep the moved popout position across conversations and app reloads"
        :checked="popoutRememberPosition"
        :disabled="!popoutEnabled"
        @toggle="setPopoutRememberPosition(!popoutRememberPosition)"
      />

      <FieldCard
        :icon="ArrowDownToLine"
        label="autodock"
        description="dock the popout automatically when its video scrolls back into view"
        :checked="popoutAutoDock"
        :disabled="!popoutEnabled"
        @toggle="setPopoutAutoDock(!popoutAutoDock)"
      />

      <FieldCard
        :icon="Menu"
        label="always show bar"
        description="keep the player bar visible; off fades it in only on hover"
        :checked="popoutShowBarAlways"
        :disabled="!popoutEnabled"
        @toggle="setPopoutShowBarAlways(!popoutShowBarAlways)"
      />
    </div>
  </div>
</template>

<style scoped>
.video-popout-panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.video-popout-panel__content {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

@media (max-width: 40rem) {
  .video-popout-panel__content {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
