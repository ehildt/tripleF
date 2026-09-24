<script setup lang="ts">
import { Brain, CircleGauge, Network, Radio, Tag } from '@lucide/vue';
import { computed, toRef } from 'vue';

import FieldCard from '@/components/shared/ui/field-card/FieldCard.vue';
import FieldGrid from '@/components/shared/ui/field-grid/FieldGrid.vue';
import InputSelect from '@/components/shared/ui/input-select/InputSelect.vue';
import InputText from '@/components/shared/ui/input-text/InputText.vue';
import ModelSelectField from '@/components/shared/ui/model-select-field/ModelSelectField.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type { DlqEntry } from '@/types/dlq-entry.model';

import { useModelsStore } from '../../../../stores/models';
import { useDlqTopBarFilters } from './composables/use-dlq-top-bar-filters';

const props = defineProps<{
  entry: DlqEntry | null;
  models: string[];
  isImmutable: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateFilter', key: string, value: unknown): void;
}>();

const entryRef = toRef(props, 'entry');
const modelsRef = toRef(props, 'models');

const modelsStore = useModelsStore();
const numCtxOptions = computed(() => {
  const all = modelsStore.numCtxOptions.map(String);
  if (!modelsRef.value.length) return all;
  if (!modelValue.value) return all;
  const model = modelsStore.getModel(modelValue.value);
  if (!model?.context_length) return all;
  return all.filter((opt) => Number(opt) <= model.context_length!);
});

const {
  modelValue,
  modelErrored,
  eventValue,
  roomIdValue,
  streamValue,
  numCtxValue,
} = useDlqTopBarFilters(entryRef, modelsRef);

/** Memory jobs (jobName `memory-*`) never stream — lock the toggle off. */
const isMemoryJob = computed(
  () => props.entry?.jobName.startsWith('memory-') ?? false,
);
const streamChecked = computed(
  () => !isMemoryJob.value && streamValue.value === 'true',
);
const streamDisabled = computed(() => props.isImmutable || isMemoryJob.value);

function onSelectModel(model: string) {
  emit('updateFilter', 'model', model);
}

function toggleStream() {
  if (isMemoryJob.value) return;
  emit('updateFilter', 'stream', streamValue.value !== 'true');
}
</script>

<template>
  <div class="dlq-top-bar">
    <FieldGrid :items-per-row="2">
      <FieldCard
        :icon="Brain"
        :label="$t('common.model')"
        :show-checkbox="false"
      >
        <template #field>
          <ModelSelectField
            :model-value="modelValue"
            :local-models="modelsStore.localModels"
            :cloud-models="modelsStore.cloudModels"
            :loading="modelsStore.modelsLoading"
            :disabled="isImmutable"
            :errored="modelErrored"
            @update:model-value="onSelectModel"
          />
        </template>
      </FieldCard>
      <FieldCard
        :icon="CircleGauge"
        :label="$t('common.context')"
        :show-checkbox="false"
      >
        <template #field>
          <InputSelect
            v-if="numCtxOptions.length > 0"
            :model-value="numCtxValue"
            :options="numCtxOptions"
            :disabled="isImmutable"
            :checkmark="false"
            :format-value="(v: string) => modelsStore.formatCtx(Number(v))"
            @update:model-value="emit('updateFilter', 'numCtx', $event)"
          />
          <Tooltip v-else :text="$t('common.loadingContextOptions')">
            <span class="dlq-top-bar__skeleton">
              <span class="dlq-top-bar__skeleton-bar" />
            </span>
          </Tooltip>
        </template>
      </FieldCard>
    </FieldGrid>
    <FieldGrid :items-per-row="3">
      <FieldCard
        :icon="Radio"
        :label="$t('common.event')"
        :show-checkbox="false"
      >
        <template #field>
          <InputText
            :model-value="eventValue"
            :disabled="isImmutable"
            variant="borderless"
            name="event-filter"
            :placeholder="$t('common.event')"
            @update:model-value="emit('updateFilter', 'event', $event)"
          />
        </template>
      </FieldCard>
      <FieldCard
        :icon="Tag"
        :label="$t('common.roomId')"
        :show-checkbox="false"
      >
        <template #field>
          <InputText
            :model-value="roomIdValue"
            :disabled="isImmutable"
            variant="borderless"
            name="room-id-filter"
            :placeholder="$t('common.roomId')"
            @update:model-value="emit('updateFilter', 'roomId', $event)"
          />
        </template>
      </FieldCard>
      <FieldCard
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
.dlq-top-bar :deep(.field-card__field) {
  flex: 2;
}

.dlq-top-bar__skeleton {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-1-5);
  padding: 0 var(--spacing-1);
}

.dlq-top-bar__skeleton-bar {
  width: 2.5rem;
  height: 0.75rem;
  background-color: var(--color-bg-tertiary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
