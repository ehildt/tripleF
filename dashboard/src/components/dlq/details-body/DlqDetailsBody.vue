<script setup lang="ts">
import { Copy } from '@lucide/vue';
import { useClipboard } from '@vueuse/core';
import { computed, ref, toRef, watch } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import { formatBody } from '@/utils/format-body.helper';

import PanelEmptyState from '../../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../../shared/ui/panel-layout/PanelLayout.vue';
import { useDlqDetailsState } from './composables/use-dlq-details-state';
import { useDlqFailureText } from './composables/use-dlq-failure-text';
import DlqMetadataSection from './metadata-section/DlqMetadataSection.vue';
import DlqPayloadEditor from './payload-editor/DlqPayloadEditor.vue';
import DlqPromptSection from './prompt-section/DlqPromptSection.vue';
import DlqTopBar from './top-bar/DlqTopBar.vue';

const props = defineProps<{
  entry: DlqEntry | null;
  models: string[];
}>();

const emit = defineEmits<{
  (e: 'savePayload', requestId: string, payload: Record<string, unknown>): void;
  (e: 'saveQueue', requestId: string, queueName: string): void;
}>();

const detailsState = useDlqDetailsState(props.models);
const { isImmutable, buildPayloadWithFilterUpdate } = detailsState;

const entryRef = toRef(props, 'entry');
const { failureText } = useDlqFailureText(entryRef);

type DetailTab = 'error' | 'metadata' | 'prompt' | 'payload';

const tabs = computed<{ id: DetailTab; label: string }[]>(() => {
  const items: { id: DetailTab; label: string }[] = [];
  if (failureText.value) {
    items.push({ id: 'error', label: 'Error' });
  }
  items.push(
    { id: 'metadata', label: 'Metadata' },
    { id: 'prompt', label: 'Prompt' },
    { id: 'payload', label: 'Payload' },
  );
  return items;
});

const activeTab = ref<DetailTab>('metadata');

watch(
  () => props.entry?.requestId,
  () => {
    activeTab.value = 'metadata';
  },
);

function selectTab(tabId: DetailTab) {
  activeTab.value = tabId;
}

function handleUpdateFilter(key: string, value: unknown) {
  if (!props.entry) return;
  const payload = buildPayloadWithFilterUpdate(props.entry, key, value);
  emit('savePayload', props.entry.requestId, payload);
}

function handleSavePayload(
  requestId: string,
  payload: Record<string, unknown>,
) {
  emit('savePayload', requestId, payload);
}

function handleSaveQueue(queueName: string) {
  if (!props.entry) return;
  emit('saveQueue', props.entry.requestId, queueName);
}

const { copy, copied: isCopied } = useClipboard({ legacy: true });

function copyPayload() {
  if (props.entry?.payload) {
    copy(formatBody(props.entry.payload));
  }
}
</script>

<template>
  <PanelLayout>
    <PanelHeader>
      <PanelHeaderTitle label="Details" />
    </PanelHeader>

    <div v-if="entry" :key="entry.requestId" class="dlq-details-body">
      <DlqTopBar
        :entry="entry"
        :models="models"
        :is-immutable="isImmutable(entry)"
        @update-filter="handleUpdateFilter"
        @save-queue="handleSaveQueue"
      />

      <div class="dlq-details-body__tabs-container">
        <div class="dlq-details-body__tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="dlq-details-body__tab"
            :class="{
              'dlq-details-body__tab--active': activeTab === tab.id,
            }"
            @click="selectTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="dlq-details-body__panel">
          <template v-if="activeTab === 'error'">
            <div class="dlq-details-body__error">
              <h4 class="dlq-details-body__error-title">Failed Reason</h4>
              <div class="dlq-details-body__error-body">
                {{ failureText }}
              </div>
            </div>
          </template>

          <template v-else-if="activeTab === 'metadata'">
            <div class="dlq-details-body__padded">
              <DlqMetadataSection :entry="entry" />
            </div>
          </template>

          <template v-else-if="activeTab === 'prompt'">
            <div class="dlq-details-body__prompt">
              <DlqPromptSection :entry="entry" />
            </div>
          </template>

          <template v-else-if="activeTab === 'payload'">
            <button
              v-if="entry.payload"
              class="dlq-details-body__copy"
              :class="{
                'dlq-details-body__copy--copied': isCopied,
              }"
              :title="isCopied ? 'Copied!' : 'Copy'"
              @click="copyPayload"
            >
              <Copy class="dlq-details-body__copy-icon" />
            </button>
            <DlqPayloadEditor
              v-if="entry.payload"
              :entry="entry"
              :is-immutable="isImmutable(entry)"
              @save-payload="handleSavePayload"
            />
          </template>
        </div>
      </div>
    </div>

    <PanelEmptyState
      v-else
      message="Select a job"
      submessage="Job details will appear here"
    />
  </PanelLayout>
</template>

<style scoped>
.dlq-details-body {
  padding: var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.dlq-details-body__tabs-container {
  border-top: 1px solid var(--color-divider);
  padding-top: var(--spacing-3);
}

.dlq-details-body__tab-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-0-5);
  margin-bottom: -1px;
  position: relative;
  z-index: 10;
}

.dlq-details-body__tab {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: var(--spacing-1-5) var(--spacing-3);
  flex: 1;
  text-align: center;
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
}

.dlq-details-body__tab:hover {
  color: var(--color-fg-secondary);
}

.dlq-details-body__tab--active {
  border: 1px solid var(--color-divider);
  border-bottom: 0;
  background-color: var(--color-bg-secondary);
  color: var(--color-accent-primary);
}

.dlq-details-body__panel {
  position: relative;
  border: 1px solid var(--color-divider);
  background-color: var(--color-bg-secondary);
  max-height: 26.75rem;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dlq-details-body__padded {
  padding: var(--spacing-3);
}

.dlq-details-body__prompt {
  padding: var(--spacing-2);
  padding-right: var(--spacing-8);
}

.dlq-details-body__error {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.dlq-details-body__error-title {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-status-error);
}

.dlq-details-body__error-body {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-status-error);
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 5%,
    transparent
  );
  padding: var(--spacing-2);
  border: 1px solid
    color-mix(in srgb, var(--color-status-error) 20%, transparent);
}

.dlq-details-body__copy {
  position: absolute;
  top: var(--spacing-2);
  right: var(--spacing-2);
  z-index: 10;
  padding: var(--spacing-1);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}

.dlq-details-body__copy:hover {
  color: var(--color-accent-primary);
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
}

.dlq-details-body__copy--copied {
  color: var(--color-accent-primary);
}

.dlq-details-body__copy-icon {
  width: 0.875rem;
  height: 0.875rem;
}
</style>
