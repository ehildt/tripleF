<script setup lang="ts">
/**
 * Toast notification settings: where the toast stack is anchored, whether
 * toasts auto-hide (and after how many seconds), whether they carry a pin
 * to keep them on screen, and which message types get toasted at all.
 *
 * Mirrors the video popout panel: same dual segmented toggles for the
 * anchor, same checkbox FieldCards, same reset + power actions in the bar.
 */
import {
  AlignCenterHorizontal,
  AlignCenterVertical,
  Anchor,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bug,
  Check,
  CircleX,
  Info,
  type LucideIcon,
  MessageSquare,
  Pin,
  Timer,
  TriangleAlert,
} from '@lucide/vue';
import { computed } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import InputNumber from '@/components/shared/ui/input-number/InputNumber.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';
import SegmentedToggle from '@/components/shared/ui/segmented-toggle/SegmentedToggle.vue';
import {
  resetToastSettings,
  setToastAnchor,
  setToastAutoHide,
  setToastDurationSeconds,
  setToastEnabled,
  setToastPinEnabled,
  setToastTypeFilter,
  type ToastAnchor,
  toastAnchor,
  toastAutoHide,
  toastDurationSeconds,
  toastEnabled,
  toastPinEnabled,
  toastTypeFilters,
} from '@/components/widgets/toast/composables/toast-settings.state';
import type { ToastType } from '@/composables/toast-state';
import { useToast } from '@/composables/use-toast';

const { preview: previewToast } = useToast();

type ToastVertical = 'top' | 'middle' | 'bottom';
type ToastHorizontal = 'left' | 'center' | 'right';

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

const TYPE_OPTIONS: readonly {
  type: ToastType;
  icon: LucideIcon;
  label: string;
  description: string;
}[] = [
  {
    type: 'info',
    icon: Info,
    label: 'info',
    description: 'general information',
  },
  {
    type: 'success',
    icon: Check,
    label: 'success',
    description: 'completed actions',
  },
  {
    type: 'warning',
    icon: TriangleAlert,
    label: 'warning',
    description: 'needs attention',
  },
  {
    type: 'error',
    icon: CircleX,
    label: 'error',
    description: 'failures and problems',
  },
  {
    type: 'debug',
    icon: Bug,
    label: 'debug',
    description: 'diagnostic details',
  },
  {
    type: 'default',
    icon: MessageSquare,
    label: 'default',
    description: 'uncategorized messages',
  },
];

const vertical = computed(
  () => toastAnchor.value.split('-')[0] as ToastVertical,
);
const horizontal = computed(
  () => toastAnchor.value.split('-')[1] as ToastHorizontal,
);

function setVertical(value: string) {
  setToastAnchor(`${value}-${horizontal.value}` as ToastAnchor);
}

function setHorizontal(value: string) {
  setToastAnchor(`${vertical.value}-${value}` as ToastAnchor);
}
</script>

<template>
  <div class="toast-panel panel-glow">
    <PanelTitleBar title="Toast Notifications">
      <template #actions>
        <PreviewButton
          title="Show an example toast"
          @click="previewToast('Example toast notification')"
        />
        <ResetButton
          title="Reset toast settings to defaults"
          @click="resetToastSettings"
        />
        <PowerToggle
          :enabled="toastEnabled"
          title="Enable toast notifications"
          @toggle="setToastEnabled(!toastEnabled)"
        />
      </template>
    </PanelTitleBar>

    <div class="toast-panel__content">
      <FieldCard
        :icon="Anchor"
        label="initial position"
        description="where the toast stack appears"
        :disabled="!toastEnabled"
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
        :icon="Timer"
        label="auto hide"
        description="seconds before a toast disappears — off keeps toasts on screen"
        :disabled="!toastEnabled"
      >
        <template #controls>
          <button
            type="button"
            class="toast-panel__checkbox"
            :class="{ 'toast-panel__checkbox--checked': toastAutoHide }"
            :disabled="!toastEnabled"
            :aria-pressed="toastAutoHide"
            aria-label="Auto hide toasts"
            @click="setToastAutoHide(!toastAutoHide)"
          >
            <Check
              v-if="toastAutoHide"
              class="toast-panel__check-icon"
              stroke-width="3"
            />
          </button>
          <div class="toast-panel__number">
            <InputNumber
              :model-value="toastDurationSeconds"
              :min="1"
              :max="30"
              :step="0.5"
              :disabled="!toastAutoHide || !toastEnabled"
              @update:model-value="setToastDurationSeconds"
            />
          </div>
        </template>
      </FieldCard>

      <FieldCard
        :icon="Pin"
        label="show pin"
        description="pin icon on each toast"
        :checked="toastPinEnabled"
        :disabled="!toastEnabled"
        @toggle="setToastPinEnabled(!toastPinEnabled)"
      />

      <div class="toast-panel__types">
        <FieldCard
          v-for="{ type, icon, label, description } in TYPE_OPTIONS"
          :key="type"
          :icon="icon"
          :label="label"
          :description="description"
          :checked="toastTypeFilters[type]"
          :disabled="!toastEnabled"
          @toggle="setToastTypeFilter(type, !toastTypeFilters[type])"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.toast-panel {
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
}

.toast-panel__content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: var(--spacing-1);
  padding: var(--spacing-1);
}

.toast-panel__types {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--spacing-1);
}

/* Checkbox + number box mirroring the FieldCard control styles — the
   built-in FieldCard checkbox always renders last, but auto hide needs
   the checkbox before its seconds input. */
.toast-panel__checkbox {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: 2px solid var(--color-fg-muted);
  background: none;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.toast-panel__checkbox:hover:not(:disabled) {
  border-color: var(--color-fg-secondary);
}

.toast-panel__checkbox--checked {
  border-color: var(--color-accent-primary);
  background-color: var(--color-accent-primary);
}

.toast-panel__checkbox:disabled {
  opacity: 0.4;
  cursor: default;
}

.toast-panel__check-icon {
  width: 0.85rem;
  height: 0.85rem;
  color: var(--color-fg-inverse);
}

.toast-panel__number {
  flex-shrink: 0;
  width: 4.5rem;
  padding: 0 var(--spacing-1);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
}

@media (max-width: 40rem) {
  .toast-panel__content {
    grid-template-columns: minmax(0, 1fr);
  }

  .toast-panel__types {
    grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
  }
}
</style>
