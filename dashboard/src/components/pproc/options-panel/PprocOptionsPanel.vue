<script setup lang="ts">
import { ArrowLeftRight, Contrast, ScanEye, Sparkles, Zap } from '@lucide/vue';

import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';

import { usePreprocessingStore } from '../../../stores/preprocessing';
import BlurSigmaInput from '../shared/ui/blur-sigma-input/BlurSigmaInput.vue';
import BrightnessInput from '../shared/ui/brightness-input/BrightnessInput.vue';
import ClaheHeightInput from '../shared/ui/clahe-height-input/ClaheHeightInput.vue';
import ClaheMaxSlopeInput from '../shared/ui/clahe-max-slope-input/ClaheMaxSlopeInput.vue';
import ClaheWidthInput from '../shared/ui/clahe-width-input/ClaheWidthInput.vue';
import NormalizeLowerInput from '../shared/ui/normalize-lower-input/NormalizeLowerInput.vue';
import NormalizeUpperInput from '../shared/ui/normalize-upper-input/NormalizeUpperInput.vue';
import PprocParamTile from '../shared/ui/param-tile/PprocParamTile.vue';
import SharpenM1Input from '../shared/ui/sharpen-m1-input/SharpenM1Input.vue';
import SharpenM2Input from '../shared/ui/sharpen-m2-input/SharpenM2Input.vue';
import SharpenSigmaInput from '../shared/ui/sharpen-sigma-input/SharpenSigmaInput.vue';

const store = usePreprocessingStore();

const iconMap = {
  Zap,
  ScanEye,
  Sparkles,
  Contrast,
};

const parameters = [
  // Row 1
  [
    {
      field: BlurSigmaInput,
      key: 'blurSigma',
      icon: 'Zap',
      label: 'Blur Sigma',
      desc: 'Gaussian blur amount',
    },
    {
      field: SharpenSigmaInput,
      key: 'sharpenSigma',
      icon: 'ScanEye',
      label: 'Sharpen Sigma',
      desc: 'Edge radius',
    },
    {
      field: SharpenM1Input,
      key: 'sharpenM1',
      icon: 'ScanEye',
      label: 'Sharpen M1',
      desc: 'Flat factor',
    },
  ],
  // Row 2
  [
    {
      field: SharpenM2Input,
      key: 'sharpenM2',
      icon: 'ScanEye',
      label: 'Sharpen M2',
      desc: 'Edge factor',
    },
    {
      field: ClaheWidthInput,
      key: 'claheWidth',
      icon: 'Sparkles',
      label: 'CLAHE Width',
      desc: 'Grid width tiles',
    },
    {
      field: ClaheHeightInput,
      key: 'claheHeight',
      icon: 'Sparkles',
      label: 'CLAHE Height',
      desc: 'Grid height tiles',
    },
  ],
  // Row 3
  [
    {
      field: ClaheMaxSlopeInput,
      key: 'claheMaxSlope',
      icon: 'Sparkles',
      label: 'Max Slope',
      desc: 'Contrast limit',
    },
    {
      field: BrightnessInput,
      key: 'brightnessLevel',
      icon: 'Sparkles',
      label: 'Brightness',
      desc: 'Brightness mult',
    },
    {
      field: NormalizeLowerInput,
      key: 'normalizeLower',
      icon: 'Contrast',
      label: 'Norm. Lower',
      desc: 'Lower percentile',
    },
  ],
  // Row 4
  [
    {
      field: NormalizeUpperInput,
      key: 'normalizeUpper',
      icon: 'Contrast',
      label: 'Norm. Upper',
      desc: 'Upper percentile',
    },
  ],
] as const;
</script>

<template>
  <div class="bg-elevated border border-divider panel-glow h-fit">
    <PanelTitleBar title="Advanced Parameters">
      <template #actions>
        <button
          class="p-1 text-fg-muted hover:text-fg-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Reset all"
          :disabled="!store.hasAnyParameterModified"
          @click="store.resetParametersToDefaults()"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
        </button>
      </template>
    </PanelTitleBar>

    <div class="p-4 space-y-2">
      <div
        v-for="(row, rowIndex) in parameters"
        :key="rowIndex"
        class="grid grid-cols-3 gap-2"
      >
        <PprocParamTile
          v-for="param in row"
          :key="param.key"
          :icon="iconMap[param.icon]"
          :label="param.label"
          :description="param.desc"
          :disabled="!store.enabled"
          :highlighted="store.isParameterHighlighted(param.key)"
          :modified="
            store.isParameterModified(
              param.key as keyof typeof store.parameters,
            )
          "
          @mouseenter="
            store.setHoveredParameter(
              param.key as keyof typeof store.parameters,
            )
          "
          @mouseleave="store.setHoveredParameter(null)"
          @reset="
            store.resetParameter(param.key as keyof typeof store.parameters)
          "
        >
          <component
            :is="param.field"
            :model-value="
              store.parameters[param.key as keyof typeof store.parameters]
            "
            :disabled="!store.enabled"
            @update:model-value="
              store.setParameter(
                param.key as keyof typeof store.parameters,
                $event,
              )
            "
          />
        </PprocParamTile>

        <!-- Fill empty slots in last row -->
        <template v-if="row.length < 3">
          <div
            v-for="n in 3 - row.length"
            :key="`empty-${n}`"
            class="p-3 border border-divider bg-primary h-25 opacity-0"
          />
        </template>
      </div>
    </div>
  </div>
</template>
