<script setup lang="ts">
/**
 * The SysCtl "Popout" tab: where the floating video popout initially
 * appears, whether a moved position is remembered across conversations and
 * reloads, and a reset back to the defaults.
 *
 * Initial position is a FieldCard row with two icon-only segmented
 * toggles: vertical (top/middle/bottom) × horizontal (left/center/right),
 * covering every position in one line.
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  PictureInPicture2,
  Pin,
  RotateCcw,
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';

import {
  type PopoutAnchor,
  popoutAnchor,
  popoutRememberPosition,
  resetPopoutSettings,
  setPopoutAnchor,
  setPopoutRememberPosition,
} from '../../chat/exchange-list/chat-exchange/exchange-content/assistant-response/composables/popout-settings.state';

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
  <div class="popout-section">
    <div class="popout-section__panel panel-glow">
      <PanelTitleBar title="Video Popout">
        <template #actions>
          <button
            type="button"
            class="popout-section__reset"
            title="Reset popout settings to defaults"
            @click="resetPopoutSettings"
          >
            <RotateCcw class="popout-section__reset-icon" />
          </button>
        </template>
      </PanelTitleBar>

      <div class="popout-section__content">
        <!-- Initial position + remember position side by side -->
        <FieldCard
          :icon="PictureInPicture2"
          label="initial position"
          description="where the popout first appears"
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
          @toggle="setPopoutRememberPosition(!popoutRememberPosition)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.popout-section {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-4);
}

.popout-section__panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.popout-section__content {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: var(--spacing-2);
  padding: var(--spacing-4);
}

@media (max-width: 40rem) {
  .popout-section__content {
    grid-template-columns: minmax(0, 1fr);
  }
}

.popout-section__reset {
  padding: var(--spacing-1);
  border: none;
  background: none;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.popout-section__reset:hover {
  color: var(--color-fg-primary);
}

.popout-section__reset-icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
