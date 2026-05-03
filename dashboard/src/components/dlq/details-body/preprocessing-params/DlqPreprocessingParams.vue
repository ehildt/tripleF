<script setup lang="ts">
import { Contrast, ScanEye, Sparkles, Zap } from '@lucide/vue';

import {
  DEFAULT_PREPROCESSING_SETTINGS,
  type PreprocessingParametersOptions,
  type PreprocessingSettings,
} from '../../../../stores/preprocessing';
import BlurSigmaInput from '../../../pproc/shared/ui/blur-sigma-input/BlurSigmaInput.vue';
import BrightnessInput from '../../../pproc/shared/ui/brightness-input/BrightnessInput.vue';
import ClaheHeightInput from '../../../pproc/shared/ui/clahe-height-input/ClaheHeightInput.vue';
import ClaheMaxSlopeInput from '../../../pproc/shared/ui/clahe-max-slope-input/ClaheMaxSlopeInput.vue';
import ClaheWidthInput from '../../../pproc/shared/ui/clahe-width-input/ClaheWidthInput.vue';
import NormalizeLowerInput from '../../../pproc/shared/ui/normalize-lower-input/NormalizeLowerInput.vue';
import NormalizeUpperInput from '../../../pproc/shared/ui/normalize-upper-input/NormalizeUpperInput.vue';
import PprocParamTile from '../../../pproc/shared/ui/param-tile/PprocParamTile.vue';
import SharpenM1Input from '../../../pproc/shared/ui/sharpen-m1-input/SharpenM1Input.vue';
import SharpenM2Input from '../../../pproc/shared/ui/sharpen-m2-input/SharpenM2Input.vue';
import SharpenSigmaInput from '../../../pproc/shared/ui/sharpen-sigma-input/SharpenSigmaInput.vue';

const props = defineProps<{
  settings: PreprocessingSettings;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:settings', value: PreprocessingSettings): void;
}>();

const iconMap: Record<string, typeof Zap> = {
  Zap,
  ScanEye,
  Sparkles,
  Contrast,
};

const parameters = [
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
  [
    {
      field: NormalizeUpperInput,
      key: 'normalizeUpper',
      icon: 'Contrast',
      label: 'Norm. Upper',
      desc: 'Upper percentile',
    },
  ],
];

function setParameter(
  key: keyof PreprocessingParametersOptions,
  value: number,
) {
  emit('update:settings', {
    ...props.settings,
    parameters: { ...props.settings.parameters, [key]: value },
  });
}

function resetParameter(key: keyof PreprocessingParametersOptions) {
  emit('update:settings', {
    ...props.settings,
    parameters: {
      ...props.settings.parameters,
      [key]: DEFAULT_PREPROCESSING_SETTINGS.parameters[key],
    },
  });
}

function isModified(key: keyof PreprocessingParametersOptions): boolean {
  return (
    props.settings.parameters[key] !==
    DEFAULT_PREPROCESSING_SETTINGS.parameters[key]
  );
}
</script>

<template>
  <div class="dlq-preprocessing-params">
    <div
      v-for="(row, rowIndex) in parameters"
      :key="rowIndex"
      class="dlq-preprocessing-params__row"
    >
      <PprocParamTile
        v-for="param in row"
        :key="param.key"
        :icon="iconMap[param.icon]"
        :label="param.label"
        :description="param.desc"
        :disabled="disabled || !settings.enabled"
        :modified="
          isModified(param.key as keyof PreprocessingParametersOptions)
        "
        @reset="
          resetParameter(param.key as keyof PreprocessingParametersOptions)
        "
      >
        <component
          :is="param.field"
          :model-value="
            settings.parameters[
              param.key as keyof PreprocessingParametersOptions
            ]
          "
          :disabled="disabled || !settings.enabled"
          @update:model-value="
            setParameter(
              param.key as keyof PreprocessingParametersOptions,
              $event,
            )
          "
        />
      </PprocParamTile>

      <template v-if="row.length < 3">
        <div
          v-for="n in 3 - row.length"
          :key="`empty-${n}`"
          class="dlq-preprocessing-params__placeholder"
        />
      </template>
    </div>
  </div>
</template>

<style scoped>
.dlq-preprocessing-params {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dlq-preprocessing-params__row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-2);
}

.dlq-preprocessing-params__placeholder {
  padding: var(--spacing-3);
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-primary);
  height: 6.25rem;
  opacity: 0;
}
</style>
