<script setup lang="ts">
import {
  ArrowDownToLine,
  Check,
  Image,
  Images,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
  ScanLine,
  Sparkles,
  Zap,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import PanelTitleBar from '@/components/shared/ui/panel-title-bar/PanelTitleBar.vue';

import {
  usePreprocessingStore,
  VARIANT_DESCRIPTIONS,
} from '../../../stores/preprocessing';
import PprocMasterToggle from '../shared/ui/master-toggle/PprocMasterToggle.vue';
import MaxHeightField from '../shared/ui/max-height-field/MaxHeightField.vue';
import MaxWidthField from '../shared/ui/max-width-field/MaxWidthField.vue';
import PprocSection from '../shared/ui/section/PprocSection.vue';
import PprocToggleButton from '../shared/ui/toggle-button/PprocToggleButton.vue';

const store = usePreprocessingStore();

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
</script>

<template>
  <div class="space-y-3">
    <div class="bg-elevated border border-divider panel-glow">
      <PanelTitleBar title="Image Preprocessing" />

      <div class="p-4 space-y-4">
        <!-- Master Toggle -->
        <PprocMasterToggle
          :enabled="store.enabled"
          @toggle="store.setEnabled(!store.enabled)"
        >
          <template #icon>
            <Zap class="w-5 h-5" />
          </template>
          <template #title>Enable Preprocessing</template>
          <template #description
            >Create multiple image variants for enhanced AI analysis</template
          >
        </PprocMasterToggle>

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
          <div class="grid grid-cols-2 gap-1">
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
      </div>
    </div>
  </div>
</template>
