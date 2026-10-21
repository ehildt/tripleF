<script setup lang="ts">
import { Brain, CircleGauge, Network, Radio, Tag } from '@lucide/vue';
import { toRef } from 'vue';

import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import ModelFieldCard from '@/components/shared/ui/model-field-card/ModelFieldCard.vue';
import NumberFieldCard from '@/components/shared/ui/number-field-card/NumberFieldCard.vue';
import SelectFieldCard from '@/components/shared/ui/select-field-card/SelectFieldCard.vue';
import TextFieldCard from '@/components/shared/ui/text-field-card/TextFieldCard.vue';
import { formatCtx } from '@/utils/format-ctx.helper';

import { useDlqTopBarFilters } from './composables/use-dlq-top-bar-filters';
import type { DlqTopBarProps } from './DlqTopBar.types';

const props = defineProps<DlqTopBarProps>();

const emit = defineEmits<{
  (e: 'updateFilter', key: string, value: unknown): void;
}>();

const {
  modelValue,
  modelErrored,
  eventValue,
  roomIdValue,
  streamValue,
  numCtxValue,
  numCtxOptions,
  isMemoryJob,
  streamChecked,
  streamDisabled,
  localModels,
  cloudModels,
  modelsLoading,
} = useDlqTopBarFilters(
  toRef(props, 'entry'),
  toRef(props, 'models'),
  toRef(props, 'isImmutable'),
);

function toggleStream() {
  if (isMemoryJob.value) return;
  emit('updateFilter', 'stream', streamValue.value !== 'true');
}
</script>

<template>
  <div class="dlq-top-bar">
    <FieldGrid :items-per-row="2">
      <ModelFieldCard
        :icon="Brain"
        :label="$t('common.model')"
        :model-value="modelValue"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :loading="modelsLoading"
        :disabled="isImmutable"
        :errored="modelErrored"
        @update:model-value="emit('updateFilter', 'model', $event)"
      />
      <SelectFieldCard
        :icon="CircleGauge"
        :label="$t('common.context')"
        :model-value="numCtxValue"
        :options="numCtxOptions"
        :disabled="isImmutable"
        :checkmark="false"
        :format-value="(v: string) => formatCtx(Number(v))"
        :loading="numCtxOptions.length === 0"
        :loading-label="$t('common.loadingContextOptions')"
        @update:model-value="emit('updateFilter', 'numCtx', $event)"
      />
    </FieldGrid>
    <FieldGrid :items-per-row="3">
      <TextFieldCard
        :icon="Radio"
        :label="$t('common.event')"
        :model-value="eventValue"
        name="event-filter"
        :placeholder="$t('common.event')"
        :disabled="isImmutable"
        @update:model-value="emit('updateFilter', 'event', $event)"
      />
      <TextFieldCard
        :icon="Tag"
        :label="$t('common.roomId')"
        :model-value="roomIdValue"
        name="room-id-filter"
        :placeholder="$t('common.roomId')"
        :disabled="isImmutable"
        @update:model-value="emit('updateFilter', 'roomId', $event)"
      />
      <NumberFieldCard
        :icon="Network"
        :label="$t('common.stream')"
        :checked="streamChecked"
        :disabled="streamDisabled"
        @toggle="toggleStream"
      />
    </FieldGrid>
  </div>
</template>

<style scoped>
.dlq-top-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* The DLQ fields have short labels and no descriptions — give the inline
   control more of the card width than the label column. */
.dlq-top-bar :deep(.model-field-card__field),
.dlq-top-bar :deep(.select-field-card__field),
.dlq-top-bar :deep(.text-field-card__field) {
  flex: 2;
}
</style>
