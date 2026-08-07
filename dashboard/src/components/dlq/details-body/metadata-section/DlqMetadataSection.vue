<script setup lang="ts">
import { Clock, Cpu, Image, Layers, Network, RefreshCw } from '@lucide/vue';
import { toRef } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';
import { formatDate } from '@/utils/format-date.helper';

import { usePayloadContextSize } from './composables/use-payload-context-size';
import { countPayloadImages } from './helpers/count-payload-images.helper';
import { getPayloadImageNames } from './helpers/get-payload-image-names.helper';
import DlqMetadataField from './metadata-field/DlqMetadataField.vue';

const props = defineProps<{
  entry: DlqEntry;
}>();

const entryRef = toRef(props, 'entry');
const { contextSize } = usePayloadContextSize(entryRef);

const imageSummary = `${countPayloadImages(props.entry)} (${getPayloadImageNames(props.entry)})`;
</script>

<template>
  <div class="dlq-metadata-section">
    <h4 class="dlq-metadata-section__title">{{ $t('common.metadata') }}</h4>
    <div class="dlq-metadata-section__list">
      <DlqMetadataField
        :icon="Layers"
        :label="$t('common.jobId')"
        :value="entry.jobId ?? '—'"
      />
      <DlqMetadataField
        :icon="Network"
        :label="$t('common.status')"
        :value="entry.status"
      />
      <DlqMetadataField
        :icon="Clock"
        :label="$t('common.failedAt')"
        :value="formatDate(entry.failedAt)"
      />
      <DlqMetadataField
        v-if="entry.nextRetryAt"
        :icon="Clock"
        :label="$t('common.retryAt')"
        :value="formatDate(entry.nextRetryAt)"
      />
      <DlqMetadataField
        :icon="Clock"
        :label="$t('common.created')"
        :value="formatDate(entry.createdAt)"
      />
      <DlqMetadataField
        :icon="RefreshCw"
        :label="$t('common.attempts')"
        :value="String(entry.totalAttempts)"
      />
      <DlqMetadataField
        :icon="Image"
        :label="$t('common.images')"
        :value="imageSummary"
      />
      <DlqMetadataField
        :icon="Cpu"
        :label="$t('common.context')"
        :value="contextSize"
      />
    </div>
  </div>
</template>

<style scoped>
.dlq-metadata-section {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.dlq-metadata-section__title {
  font-family: var(--font-mono);
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-fg-muted);
}

.dlq-metadata-section__list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1-5);
}
</style>
