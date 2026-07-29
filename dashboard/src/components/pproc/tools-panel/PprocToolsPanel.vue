<script setup lang="ts">
import {
  Activity,
  ArrowDownToLine,
  ArrowUpToLine,
  Check,
  Columns3,
  Focus,
  Image,
  ImagePlus,
  Images,
  Maximize2,
  Minus,
  MoveHorizontal,
  MoveVertical,
  Rows3,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrendingUp,
  Waves,
  Zap,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import Lightbox from '@/components/shared/ui/lightbox/Lightbox.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';
import PowerToggle from '@/components/shared/ui/power-toggle/PowerToggle.vue';
import PreviewButton from '@/components/shared/ui/preview-button/PreviewButton.vue';
import ResetButton from '@/components/shared/ui/reset-button/ResetButton.vue';

import {
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from '../../../stores/preprocessing';
import MaxHeightField from '../shared/ui/max-height-field/MaxHeightField.vue';
import MaxWidthField from '../shared/ui/max-width-field/MaxWidthField.vue';
import PprocSection from '../shared/ui/section/PprocSection.vue';
import PprocToggleButton from '../shared/ui/toggle-button/PprocToggleButton.vue';
import { usePreprocessingPreview } from './composables/use-preprocessing-preview';

const store = usePreprocessingStore();

const {
  isPreviewLoading,
  lightbox,
  onFilePicked,
  onPreviewClick,
  repickImage,
} = usePreprocessingPreview();

const variantConfig: Record<
  string,
  { icon: typeof Image; label: string; description: string }
> = {
  original: {
    icon: Image,
    label: 'Original',
    description: VARIANT_DESCRIPTIONS.original,
  },
  grayscale: {
    icon: ScanLine,
    label: 'Grayscale',
    description: VARIANT_DESCRIPTIONS.grayscale,
  },
  denoised: {
    icon: Zap,
    label: 'Denoise',
    description: VARIANT_DESCRIPTIONS.denoised,
  },
  sharpened: {
    icon: Sparkles,
    label: 'Sharpen',
    description: VARIANT_DESCRIPTIONS.sharpened,
  },
  clahe: {
    icon: Sparkles,
    label: 'CLAHE',
    description: VARIANT_DESCRIPTIONS.clahe,
  },
};

function toggleVariant(key: keyof typeof store.variants) {
  if (!store.enabled) return;
  store.setVariant(key, !store.variants[key]);
}

const parameters = [
  {
    key: 'blurSigma',
    icon: Waves,
    label: 'Blur Sigma',
    desc: 'Gaussian blur amount',
    step: 0.1,
    placeholder: '0.5',
  },
  {
    key: 'sharpenSigma',
    icon: Focus,
    label: 'Sharpen Sigma',
    desc: 'Edge radius',
    step: 0.1,
    placeholder: '1.0',
  },
  {
    key: 'sharpenM1',
    icon: Minus,
    label: 'Sharpen M1',
    desc: 'Flat factor',
    step: 0.1,
    placeholder: '1.0',
  },
  {
    key: 'sharpenM2',
    icon: Activity,
    label: 'Sharpen M2',
    desc: 'Edge factor',
    step: 0.1,
    placeholder: '2.0',
  },
  {
    key: 'claheWidth',
    icon: Columns3,
    label: 'CLAHE Width',
    desc: 'Grid width tiles',
    placeholder: '8',
  },
  {
    key: 'claheHeight',
    icon: Rows3,
    label: 'CLAHE Height',
    desc: 'Grid height tiles',
    placeholder: '8',
  },
  {
    key: 'claheMaxSlope',
    icon: TrendingUp,
    label: 'Max Slope',
    desc: 'Contrast limit',
    step: 0.1,
    placeholder: '3.0',
  },
  {
    key: 'brightnessLevel',
    icon: Sun,
    label: 'Brightness',
    desc: 'Brightness mult',
    step: 0.1,
    placeholder: '1.2',
  },
  {
    key: 'normalizeLower',
    icon: ArrowDownToLine,
    label: 'Norm. Lower',
    desc: 'Lower percentile',
    step: 0.1,
    placeholder: '1',
  },
  {
    key: 'normalizeUpper',
    icon: ArrowUpToLine,
    label: 'Norm. Upper',
    desc: 'Upper percentile',
    placeholder: '99',
  },
] as const;
</script>

<template>
  <div class="space-y-3">
    <div class="bg-elevated border border-divider panel-glow">
      <PanelTitleBar title="Image Preprocessing">
        <template #actions>
          <PreviewButton
            title="Preview preprocessing on an image"
            :disabled="isPreviewLoading"
            @click="onPreviewClick"
          />
          <ResetButton
            title="Reset preprocessing to defaults"
            @click="store.resetToDefaults()"
          />
          <PowerToggle
            :enabled="store.enabled"
            tone="preprocessing"
            title="Enable preprocessing"
            @toggle="store.setEnabled(!store.enabled)"
          />
        </template>
      </PanelTitleBar>

      <div class="p-4 space-y-4">
        <!-- Resize Settings -->
        <PprocSection :icon="ArrowDownToLine" title="Resize Settings">
          <div class="grid grid-cols-3 gap-1">
            <FieldCard
              :icon="MoveHorizontal"
              label="Max Width"
              description="in pixels"
              :disabled="!store.enabled"
              tone="preprocessing"
            >
              <template #field>
                <MaxWidthField
                  :model-value="store.resize.maxWidth"
                  :disabled="!store.enabled"
                  @update:model-value="
                    store.setMaxWidth(
                      $event as 256 | 384 | 512 | 640 | 768 | 1024,
                    )
                  "
                />
              </template>
            </FieldCard>

            <FieldCard
              :icon="MoveVertical"
              label="Max Height"
              description="in pixels"
              :disabled="!store.enabled"
              tone="preprocessing"
            >
              <template #field>
                <MaxHeightField
                  :model-value="store.resize.maxHeight"
                  :disabled="!store.enabled"
                  @update:model-value="store.setMaxHeight($event)"
                />
              </template>
            </FieldCard>

            <FieldCard
              :icon="Maximize2"
              label="Prevent Upscaling"
              description="skip smaller images"
              :checked="store.resize.withoutEnlargement"
              :disabled="!store.enabled"
              tone="preprocessing"
              @toggle="
                store.setWithoutEnlargement(!store.resize.withoutEnlargement)
              "
            />
          </div>
        </PprocSection>

        <!-- Variants -->
        <PprocSection :icon="Images" title="Image Variants">
          <div class="grid grid-cols-5 gap-1">
            <PprocToggleButton
              v-for="(config, key) in variantConfig"
              :key="key"
              :selected="store.variants[key as keyof typeof store.variants]"
              :disabled="!store.enabled"
              :highlighted="store.isVariantHighlighted(key)"
              @click="toggleVariant(key as keyof typeof store.variants)"
              @mouseenter="
                store.setHoveredVariant(key as keyof typeof store.variants)
              "
              @mouseleave="store.setHoveredVariant(null)"
            >
              <template #icon>
                <div
                  class="w-9 h-9 flex items-center justify-center transition-all duration-200"
                  :class="[
                    store.enabled
                      ? store.variants[key as keyof typeof store.variants]
                        ? 'bg-tab-preprocessing/20 text-tab-preprocessing'
                        : 'bg-fg-muted/10 text-fg-muted group-hover:text-fg-secondary group-hover:bg-fg-muted/20'
                      : 'bg-fg-muted/5 text-fg-muted/40',
                  ]"
                >
                  <component :is="config.icon" class="w-4 h-4" />
                </div>
              </template>
              <template #content>
                <span
                  class="block font-mono font-bold text-xs capitalize"
                  :class="[
                    store.enabled
                      ? store.variants[key as keyof typeof store.variants]
                        ? 'text-fg-primary'
                        : 'text-fg-secondary'
                      : 'text-fg-muted',
                  ]"
                >
                  {{ config.label }}
                </span>
                <span
                  class="block text-[10px] font-mono leading-tight"
                  :class="store.enabled ? 'text-fg-muted' : 'text-fg-muted/60'"
                >
                  {{ config.description }}
                </span>
              </template>
              <template #checkbox>
                <div
                  class="w-5 h-5 border-2 flex items-center justify-center transition-all duration-200"
                  :class="[
                    store.variants[key as keyof typeof store.variants] &&
                    store.enabled
                      ? 'bg-tab-preprocessing border-tab-preprocessing'
                      : store.enabled
                        ? 'border-fg-muted group-hover:border-fg-secondary'
                        : 'border-fg-muted/40',
                  ]"
                >
                  <Check
                    v-if="
                      store.variants[key as keyof typeof store.variants] &&
                      store.enabled
                    "
                    class="w-3.5 h-3.5 text-fg-inverse"
                    stroke-width="3"
                  />
                </div>
              </template>
            </PprocToggleButton>
          </div>
        </PprocSection>

        <!-- Advanced Parameters -->
        <PprocSection :icon="SlidersHorizontal" title="Advanced Parameters">
          <div class="grid grid-cols-5 gap-2">
            <FieldCard
              v-for="param in parameters"
              :key="param.key"
              :icon="param.icon"
              :label="param.label"
              :description="param.desc"
              :number-value="store.parameters[param.key]"
              :number-step="'step' in param ? param.step : undefined"
              :number-placeholder="param.placeholder"
              :checked="store.isParameterModified(param.key)"
              :disabled="!store.enabled"
              :highlighted="store.isParameterHighlighted(param.key)"
              tone="preprocessing"
              @toggle="store.resetParameter(param.key)"
              @update:number-value="store.setParameter(param.key, $event)"
              @mouseenter="store.setHoveredParameter(param.key)"
              @mouseleave="store.setHoveredParameter(null)"
            />
          </div>
        </PprocSection>
      </div>
    </div>

    <input
      ref="fileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="pproc-tools-panel__file-input"
      @change="onFilePicked"
    />

    <Lightbox
      :images="lightbox.images.value"
      :index="lightbox.index.value"
      :active-title="lightbox.activeTitle.value"
      :is-open="lightbox.isOpen.value"
      @close="lightbox.close"
      @prev="lightbox.goPrev"
      @next="lightbox.goNext"
      @select-index="lightbox.index.value = $event"
    >
      <template #actions>
        <button
          type="button"
          class="pproc-tools-panel__repick"
          title="Pick a different image"
          aria-label="Pick a different image"
          @click="repickImage"
        >
          <ImagePlus class="pproc-tools-panel__repick-icon" />
        </button>
      </template>
    </Lightbox>
  </div>
</template>

<style scoped>
.pproc-tools-panel__file-input {
  display: none;
}

.pproc-tools-panel__repick {
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
  flex-shrink: 0;
}

.pproc-tools-panel__repick:hover {
  color: var(--color-accent-primary);
}

.pproc-tools-panel__repick-icon {
  width: 1.25rem;
  height: 1.25rem;
}
</style>
