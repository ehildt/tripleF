<script setup lang="ts">
import { FaceSlightlySmiling } from '@lucide/vue';
import { useClipboard } from '@vueuse/core';
import { computed, ref, toRef, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import type { DlqEntry } from '@/types/dlq-entry.model';
import { formatBody } from '@/utils/format-body.helper';

import PanelEmptyState from '../../shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '../../shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '../../shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '../../shared/ui/panel-layout/PanelLayout.vue';
import TabPanel from '../../shared/ui/tab-panel/TabPanel.vue';
import { useDlqDetailsState } from './composables/use-dlq-details-state';
import { useDlqFailureText } from './composables/use-dlq-failure-text';
import DlqMetadataSection from './metadata-section/DlqMetadataSection.vue';
import DlqPayloadEditor from './payload-editor/DlqPayloadEditor.vue';
import DlqPromptSection from './prompt-section/DlqPromptSection.vue';
import DlqTopBar from './top-bar/DlqTopBar.vue';
import type { DlqDetailTab } from './DlqDetailsBody.types';

const props = defineProps<{
  entry: DlqEntry | null;
  models: string[];
}>();

const emit = defineEmits<{
  (e: 'savePayload', requestId: string, payload: Record<string, unknown>): void;
  (e: 'saveQueue', requestId: string, queueName: string): void;
}>();

const { t } = useI18n();

const detailsState = useDlqDetailsState(props.models);
const { isImmutable, buildPayloadWithFilterUpdate } = detailsState;

const entryRef = toRef(props, 'entry');
const { failureText, failureRaw } = useDlqFailureText(entryRef);

const tabs = computed<Array<{ id: DlqDetailTab; label: string }>>(() => {
  const items: Array<{ id: DlqDetailTab; label: string }> = [];
  if (failureText.value) {
    items.push({ id: 'error', label: t('common.error') });
  }
  items.push(
    { id: 'metadata', label: t('common.metadata') },
    { id: 'prompt', label: t('common.prompt') },
    { id: 'payload', label: t('common.payload') },
  );
  return items;
});

const activeTab = ref<DlqDetailTab | null>('metadata');

watch(
  () => props.entry?.requestId,
  () => {
    activeTab.value = 'metadata';
  },
);

function selectTab(tabId: string) {
  const tab = tabs.value.find((t) => t.id === tabId);
  if (tab) activeTab.value = tab.id;
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
      <PanelHeaderTitle :label="$t('common.details')" />
    </PanelHeader>

    <div v-if="entry" :key="entry.requestId" class="dlq-details-body">
      <DlqTopBar
        :entry="entry"
        :models="models"
        :is-immutable="isImmutable(entry)"
        @update-filter="handleUpdateFilter"
        @save-queue="handleSaveQueue"
      />

      <TabPanel
        :tabs="tabs"
        :active-tab="activeTab"
        :copyable="activeTab === 'payload'"
        :copied="isCopied"
        @select="selectTab"
        @copy="copyPayload"
      >
        <template v-if="activeTab === 'error'">
          <div class="dlq-details-body__error">
            <h4 class="dlq-details-body__error-title">
              {{ $t('common.failedReason') }}
            </h4>
            <div class="dlq-details-body__error-body">
              {{ failureText }}
            </div>
            <pre v-if="failureRaw" class="dlq-details-body__error-raw">{{
              failureRaw
            }}</pre>
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
          <DlqPayloadEditor
            v-if="entry.payload"
            :entry="entry"
            :is-immutable="isImmutable(entry)"
            @save-payload="handleSavePayload"
          />
        </template>
      </TabPanel>
    </div>

    <PanelEmptyState
      v-else
      :icon="FaceSlightlySmiling"
      :message="$t('common.gotYouBro')"
      :submessage="''"
    />
  </PanelLayout>
</template>

<style scoped>
.dlq-details-body {
  padding: var(--spacing-4);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-4);
  min-height: 0;
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
  overflow-wrap: anywhere;
}

/* Complex failure objects (Zod / AI-SDK validation) in full, formatted. */
.dlq-details-body__error-raw {
  margin: 0;
  padding: var(--spacing-2);
  font-family: var(--font-mono);
  font-size: 0.625rem;
  line-height: 1.5;
  color: var(--color-fg-secondary);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  overflow-x: auto;
}
</style>
