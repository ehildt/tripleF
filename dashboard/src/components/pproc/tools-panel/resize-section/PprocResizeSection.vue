<script setup lang="ts">
import {
  ArrowDownToLine,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import {
  type PreprocessingSize,
  usePreprocessingStore,
} from '@/stores/preprocessing';

import MaxHeightField from '../../shared/ui/max-height-field/MaxHeightField.vue';
import MaxWidthField from '../../shared/ui/max-width-field/MaxWidthField.vue';
import PprocSection from '../../shared/ui/section/PprocSection.vue';

const store = usePreprocessingStore();

const PREPROCESSING_WIDTHS: readonly PreprocessingSize[] = [
  256, 384, 512, 640, 768, 1024,
];

function updateMaxWidth(value: PreprocessingSize) {
  if (PREPROCESSING_WIDTHS.includes(value)) {
    store.setMaxWidth(value);
  }
}
</script>

<template>
  <PprocSection :icon="ArrowDownToLine" title="Resize Settings">
    <div class="pproc-resize-section__grid">
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
            @update:model-value="updateMaxWidth"
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
            @update:model-value="store.setMaxHeight"
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
        @toggle="store.setWithoutEnlargement(!store.resize.withoutEnlargement)"
      />
    </div>
  </PprocSection>
</template>

<style scoped>
.pproc-resize-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
