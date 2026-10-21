<script setup lang="ts">
import { useClipboard } from '@vueuse/core';
import { toRef } from 'vue';

import TabPanel from '@/components/shared/ui/tab-panel/TabPanel.vue';
import { formatBody } from '@/utils/format-body.helper';

import { useDlqDetailsState } from '../composables/use-dlq-details-state';
import { useDlqFailureText } from '../composables/use-dlq-failure-text';
import DlqErrorSection from '../dlq-error-section/DlqErrorSection.vue';
import DlqMetadataSection from '../dlq-metadata-section/DlqMetadataSection.vue';
import DlqPayloadEditor from '../dlq-payload-editor/DlqPayloadEditor.vue';
import DlqPromptSection from '../dlq-prompt-section/DlqPromptSection.vue';
import DlqTopBar from '../dlq-top-bar/DlqTopBar.vue';
import type {
  DlqEntryDetailsEmits,
  DlqEntryDetailsProps,
} from './DlqEntryDetails.types';

/**
 * The selected entry's details: the filter top bar plus the tabbed sections
 * (error / metadata / prompt / payload editor). Only one tab section renders
 * at a time — each branch carries its own `v-if` on its root element. The
 * entry is guaranteed non-null by the parent's `v-if`, so nothing here
 * re-checks it.
 */
const props = defineProps<DlqEntryDetailsProps>();

const emit = defineEmits<DlqEntryDetailsEmits>();

const entryRef = toRef(props, 'entry');

const {
  isImmutable,
  buildPayloadWithFilterUpdate,
  tabs,
  activeTab,
  selectTab,
} = useDlqDetailsState(entryRef, props.models);
const { failureText, failureRaw } = useDlqFailureText(entryRef);

function handleUpdateFilter(key: string, value: unknown) {
  const payload = buildPayloadWithFilterUpdate(props.entry, key, value);
  emit('savePayload', props.entry.id, payload);
}

const { copy, copied: isCopied } = useClipboard({ legacy: true });

function copyPayload() {
  if (props.entry.payload) {
    copy(formatBody(props.entry.payload));
  }
}
</script>

<template>
  <div class="dlq-entry-details">
    <DlqTopBar
      :entry="entry"
      :models="models"
      :is-immutable="isImmutable(entry)"
      @update-filter="handleUpdateFilter"
    />

    <TabPanel
      :tabs="tabs"
      :active-tab="activeTab"
      :copyable="activeTab === 'payload'"
      :copied="isCopied"
      @select="selectTab"
      @copy="copyPayload"
    >
      <DlqErrorSection
        v-if="activeTab === 'error'"
        :failure-text="failureText"
        :failure-raw="failureRaw"
      />

      <DlqMetadataSection v-if="activeTab === 'metadata'" :entry="entry" />

      <DlqPromptSection v-if="activeTab === 'prompt'" :entry="entry" />

      <DlqPayloadEditor
        v-if="activeTab === 'payload' && entry.payload"
        :entry="entry"
        :is-immutable="isImmutable(entry)"
        @save-payload="
          (id: string, payload: Record<string, unknown>) =>
            emit('savePayload', id, payload)
        "
      />
    </TabPanel>
  </div>
</template>

<style scoped>
.dlq-entry-details {
  padding: var(--spacing-4);
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: var(--spacing-4);
  min-height: 0;
}
</style>
