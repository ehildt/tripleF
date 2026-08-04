<script setup lang="ts">
import {
  AlertCircle,
  Brain,
  CircleGauge,
  ListOrdered,
  Network,
  Radio,
  Tag,
} from '@lucide/vue';
import { computed, toRef } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import { useModelsStore } from '../../../../stores/models';
import Dropdown from '../../../shared/ui/drop-down/DropDown.vue';
import InputText from '../../../shared/ui/input-text/InputText.vue';
import { useDlqTopBarFilters } from './composables/use-dlq-top-bar-filters';

const props = defineProps<{
  entry: DlqEntry | null;
  models: string[];
  isImmutable: boolean;
}>();

const emit = defineEmits<{
  (e: 'updateFilter', key: string, value: unknown): void;
  (e: 'saveQueue', queueName: string): void;
}>();

const entryRef = toRef(props, 'entry');
const modelsRef = toRef(props, 'models');

const queueOptions = ['harness'] as const;

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
  modelOptions,
  eventValue,
  roomIdValue,
  streamValue,
  numCtxValue,
} = useDlqTopBarFilters(entryRef, modelsRef);
</script>

<template>
  <div class="dlq-top-bar">
    <div class="dlq-top-bar__row">
      <div class="dlq-top-bar__field">
        <Dropdown
          label="Model"
          :model-value="modelValue"
          :options="modelOptions"
          :disabled="isImmutable"
          :errored="modelErrored"
          @update:model-value="emit('updateFilter', 'vLLM', $event)"
        >
          <Brain class="w-3.5 h-3.5" />
          <template #error-icon>
            <AlertCircle class="w-3.5 h-3.5 shrink-0 text-status-error" />
          </template>
        </Dropdown>
      </div>
      <div class="dlq-top-bar__field">
        <Dropdown
          label="Queue"
          :model-value="entry?.queueName ?? ''"
          :options="queueOptions"
          :disabled="isImmutable"
          @update:model-value="emit('saveQueue', $event)"
        >
          <ListOrdered class="w-3.5 h-3.5" />
        </Dropdown>
      </div>
    </div>
    <div class="dlq-top-bar__row">
      <div class="dlq-top-bar__field">
        <InputText
          :model-value="eventValue"
          :disabled="isImmutable"
          name="event-filter"
          placeholder="Event"
          @update:model-value="emit('updateFilter', 'event', $event)"
        >
          <template #prepend-icon>
            <Radio class="w-3.5 h-3.5 text-fg-muted" />
          </template>
        </InputText>
      </div>
      <div class="dlq-top-bar__field">
        <InputText
          :model-value="roomIdValue"
          :disabled="isImmutable"
          name="room-id-filter"
          placeholder="Room ID"
          @update:model-value="emit('updateFilter', 'roomId', $event)"
        >
          <template #prepend-icon>
            <Tag class="w-3.5 h-3.5 text-fg-muted" />
          </template>
        </InputText>
      </div>
    </div>
    <div class="dlq-top-bar__row">
      <div class="dlq-top-bar__field">
        <Dropdown
          label="Stream"
          :model-value="streamValue"
          :options="['false', 'true']"
          :disabled="isImmutable"
          @update:model-value="
            emit('updateFilter', 'stream', $event === 'true')
          "
        >
          <Network class="w-3.5 h-3.5" />
        </Dropdown>
      </div>
      <template v-if="numCtxOptions.length > 0">
        <div class="dlq-top-bar__field">
          <Dropdown
            label="Context"
            :options="numCtxOptions"
            :model-value="numCtxValue"
            :disabled="isImmutable"
            :format-value="(v: string) => modelsStore.formatCtx(Number(v))"
            @update:model-value="emit('updateFilter', 'numCtx', $event)"
          >
            <CircleGauge class="w-3.5 h-3.5" />
          </Dropdown>
        </div>
      </template>
      <span
        v-else
        class="dlq-top-bar__skeleton"
        title="Loading context size options…"
      >
        <span class="dlq-top-bar__skeleton-bar" />
      </span>
    </div>
  </div>
</template>

<style scoped>
.dlq-top-bar {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dlq-top-bar__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
}

.dlq-top-bar__field {
  flex: 1;
  min-width: 0;
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
