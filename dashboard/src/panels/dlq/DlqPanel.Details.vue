<script setup lang="ts">
import {
  Brain,
  Check,
  Clock,
  FileJson,
  FilePenLine,
  Layers,
  ListOrdered,
  X,
} from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';

import InputSelect from '../../components/ui/InputSelect.vue';
import InputTextArea from '../../components/ui/InputTextArea.vue';
import type { VisionDlq } from '../../types/vision-dlq.model';
import { formatBody, formatDate } from '../../utils/formatting.helper';
import DebugPanelEmptyState from '../debug/DebugPanel.EmptyState.vue';
import DebugPanelHeaderTitle from '../debug/DebugPanel.Header.Title.vue';
import DebugPanelHeader from '../debug/DebugPanel.Header.vue';
import DebugPanelLayout from '../debug/DebugPanel.Layout.vue';

const props = defineProps<{
  entry: VisionDlq | null;
  models: string[];
}>();

const emit = defineEmits<{
  (e: 'savePayload', requestId: string, payload: Record<string, unknown>): void;
  (e: 'saveQueue', requestId: string, queueName: string): void;
}>();

type ViewMode = 'payload' | 'metadata';

const queueOptions = ['describe', 'compare', 'ocr'];
const viewMode = ref<ViewMode>('metadata');
const isEditingPayload = ref(false);
const payloadText = ref('');

watch(
  () => props.entry,
  () => {
    viewMode.value = 'metadata';
    isEditingPayload.value = false;
  },
  { immediate: true },
);

const filters = computed(() => {
  const payload = props.entry?.payload;
  if (!payload) return null;
  return (payload as any)?.filters || null;
});

const model = computed(() => {
  if (!filters.value) return null;
  return filters.value.vLLM || filters.value.model || null;
});

const modelExists = computed(() => {
  const m = model.value;
  return m && props.models.includes(m);
});

const isImmutable = computed(() => props.entry?.status === 'PENDING_DELETION');

const failureText = computed(() => {
  const reason = props.entry?.failedReason;
  if (!reason) return null;
  if (/^[{[]/.test(reason.trim())) {
    try {
      const obj = JSON.parse(reason);
      return obj.message || obj.error || obj.reason || obj.toString();
    } catch {
      return reason;
    }
  }
  return reason;
});

function updateFilter(key: string, value: unknown) {
  if (!props.entry?.payload) return;
  const payload = JSON.parse(JSON.stringify(props.entry.payload));
  if (!payload.filters) payload.filters = {};
  payload.filters[key] = value;
  emit('savePayload', props.entry.requestId, payload);
}

function toggleViewMode() {
  viewMode.value = viewMode.value === 'payload' ? 'metadata' : 'payload';
  isEditingPayload.value = false;
}

function startEdit() {
  payloadText.value = JSON.stringify(props.entry?.payload ?? {}, null, 2);
  isEditingPayload.value = true;
}

function cancelEdit() {
  isEditingPayload.value = false;
}

function saveEdit() {
  if (!props.entry) return;
  try {
    const parsed = JSON.parse(payloadText.value);
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new Error('Payload must be an object');
    }
    emit(
      'savePayload',
      props.entry.requestId,
      parsed as Record<string, unknown>,
    );
    isEditingPayload.value = false;
  } catch {
    alert('Invalid JSON. Please correct before saving.');
  }
}

function onQueueChange(newQueue: string) {
  if (!props.entry) return;
  emit('saveQueue', props.entry.requestId, newQueue);
}
</script>

<template>
  <DebugPanelLayout class="h-full">
    <DebugPanelHeader>
      <DebugPanelHeaderTitle label="Job Details" />
    </DebugPanelHeader>

    <div v-if="entry" :key="entry.requestId" class="p-4 space-y-5">
      <!-- Button row: Payload | Model | Queue -->
      <div class="flex items-center gap-3">
        <button
          class="flex items-center justify-center px-3 h-[38px] bg-secondary border cursor-pointer transition-colors shrink-0"
          :class="
            viewMode === 'payload'
              ? 'border-(--color-accent-active) text-(--color-accent-active)'
              : 'border-divider text-fg-muted hover:border-fg-muted hover:text-fg-primary'
          "
          @click="toggleViewMode"
        >
          <FileJson class="w-3.5 h-3.5" />
        </button>
        <div class="flex-1 min-w-0">
          <InputSelect
            v-if="modelExists"
            :model-value="model"
            :options="models"
            :disabled="isImmutable"
            @update:model-value="updateFilter('vLLM', $event)"
          >
            <template #prepend-icon>
              <Brain class="w-3.5 h-3.5 text-fg-muted" />
            </template>
          </InputSelect>
          <span v-else class="text-xs font-mono text-status-error">{{
            model ?? '—'
          }}</span>
        </div>
        <div class="flex-1 min-w-0">
          <InputSelect
            :model-value="entry.queueName"
            :options="queueOptions"
            :disabled="isImmutable"
            @update:model-value="onQueueChange"
          >
            <template #prepend-icon>
              <ListOrdered class="w-3.5 h-3.5 text-fg-muted" />
            </template>
          </InputSelect>
        </div>
        <div class="shrink-0" />
      </div>

      <!-- Failed Reason -->
      <div v-if="failureText" class="space-y-2">
        <h4
          class="text-[10px] font-mono font-bold uppercase tracking-wider text-status-error"
        >
          Failed Reason
        </h4>
        <div
          class="text-xs font-mono text-status-error bg-status-error/5 p-2 border border-status-error/20"
        >
          {{ failureText }}
        </div>
      </div>

      <!-- Payload view -->
      <div
        v-if="viewMode === 'payload' && entry.payload"
        class="relative space-y-2"
      >
        <div
          v-if="!isImmutable"
          class="absolute right-2 top-2 z-10 flex items-center gap-1"
        >
          <template v-if="isEditingPayload">
            <button
              class="p-1 text-status-success hover:bg-status-success/10 transition-colors"
              @click="saveEdit"
            >
              <Check class="w-3.5 h-3.5" />
            </button>
            <button
              class="p-1 text-status-error hover:bg-status-error/10 transition-colors"
              @click="cancelEdit"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </template>
          <button
            v-else
            class="p-1 text-fg-muted hover:text-fg-primary transition-colors"
            @click="startEdit()"
          >
            <FilePenLine class="w-3.5 h-3.5" />
          </button>
        </div>
        <InputTextArea
          v-if="isEditingPayload && !isImmutable"
          v-model="payloadText"
          :rows="Math.max(5, (payloadText.match(/\n/g) || []).length + 3)"
          class="font-mono text-xs select-text resize-none!"
        />
        <pre
          v-else
          class="text-xs font-mono text-fg-primary whitespace-pre-wrap break-word bg-secondary p-2 border border-divider select-text"
          :class="{ 'cursor-pointer': !isImmutable }"
          @click="!isImmutable && startEdit()"
          >{{ formatBody(entry.payload) }}</pre
        >
      </div>

      <!-- Metadata view -->
      <div v-if="viewMode === 'metadata'" class="space-y-3">
        <h4
          class="text-[10px] font-mono font-bold uppercase tracking-wider text-fg-muted"
        >
          Metadata
        </h4>
        <div class="space-y-1.5">
          <div class="flex items-center gap-2">
            <Layers class="w-3 h-3 text-fg-muted" />
            <span class="text-[10px] font-mono text-fg-muted uppercase w-20"
              >Job ID</span
            >
            <span class="text-xs font-mono text-fg-primary">{{
              entry.jobId ?? '—'
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="w-3 h-3 text-fg-muted" />
            <span class="text-[10px] font-mono text-fg-muted uppercase w-20"
              >Failed At</span
            >
            <span class="text-xs font-mono text-fg-primary">{{
              formatDate(entry.failedAt)
            }}</span>
          </div>
          <div v-if="entry.nextRetryAt" class="flex items-center gap-2">
            <Clock class="w-3 h-3 text-fg-muted" />
            <span class="text-[10px] font-mono text-fg-muted uppercase w-20"
              >Retry At</span
            >
            <span class="text-xs font-mono text-fg-primary">{{
              formatDate(entry.nextRetryAt)
            }}</span>
          </div>
          <div class="flex items-center gap-2">
            <Clock class="w-3 h-3 text-fg-muted" />
            <span class="text-[10px] font-mono text-fg-muted uppercase w-20"
              >Created</span
            >
            <span class="text-xs font-mono text-fg-primary">{{
              formatDate(entry.createdAt)
            }}</span>
          </div>
        </div>
      </div>
    </div>

    <DebugPanelEmptyState
      v-else
      message="Select a job"
      submessage="Job details will appear here"
    />
  </DebugPanelLayout>
</template>
