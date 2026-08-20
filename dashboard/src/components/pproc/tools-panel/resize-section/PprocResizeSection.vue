<script setup lang="ts">
import {
  ArrowDownToLine,
  Maximize2,
  MoveHorizontal,
  MoveVertical,
} from '@lucide/vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import { usePreprocessingStore } from '@/stores/preprocessing';
import type { PreprocessingSize } from '@/types/preprocessing.model';

import SectionHeader from '../../../shared/ui/section-header/SectionHeader.vue';
import MaxHeightField from '../../shared/ui/max-height-field/MaxHeightField.vue';
import MaxWidthField from '../../shared/ui/max-width-field/MaxWidthField.vue';

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
  <div class="pproc-resize-section">
    <SectionHeader
      :icon="ArrowDownToLine"
      :title="$t('common.resizeSettings')"
    />
    <div class="pproc-resize-section__grid">
      <FieldCard
        :icon="MoveHorizontal"
        :label="$t('common.maxWidth')"
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
        :label="$t('common.maxHeight')"
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
        :label="$t('common.preventUpscaling')"
        description="skip smaller images"
        :checked="store.resize.withoutEnlargement"
        :disabled="!store.enabled"
        tone="preprocessing"
        @toggle="store.setWithoutEnlargement(!store.resize.withoutEnlargement)"
      />
    </div>
  </div>
</template>

<style scoped>
.pproc-resize-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.pproc-resize-section__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-1);
}
</style>
