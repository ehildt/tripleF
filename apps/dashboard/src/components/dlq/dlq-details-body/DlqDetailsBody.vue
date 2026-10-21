<script setup lang="ts">
import { FaceSlightlySmiling } from '@lucide/vue';

import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import PanelHeader from '@/components/shared/ui/panel-header/PanelHeader.vue';
import PanelHeaderTitle from '@/components/shared/ui/panel-header-title/PanelHeaderTitle.vue';
import PanelLayout from '@/components/shared/ui/panel-layout/PanelLayout.vue';

import DlqEntryDetails from './dlq-entry-details/DlqEntryDetails.vue';
import type { DlqDetailsBodyProps } from './DlqDetailsBody.types';

/**
 * The DLQ details panel: header, then either the selected entry's details
 * (`DlqEntryDetails`, remounted per entry id) or the empty state. The
 * orchestrator owns the visibility `v-if`s; the sections live in the body
 * component.
 */
defineProps<DlqDetailsBodyProps>();

const emit = defineEmits<{
  (e: 'savePayload', id: string, payload: Record<string, unknown>): void;
}>();
</script>

<template>
  <PanelLayout>
    <PanelHeader>
      <PanelHeaderTitle :label="$t('common.details')" />
    </PanelHeader>

    <DlqEntryDetails
      v-if="entry"
      :key="entry.id"
      :entry="entry"
      :models="models"
      @save-payload="
        (id: string, payload: Record<string, unknown>) =>
          emit('savePayload', id, payload)
      "
    />

    <PanelEmptyState
      v-if="!entry"
      :icon="FaceSlightlySmiling"
      :message="$t('common.gotYouBro')"
      :submessage="''"
    />
  </PanelLayout>
</template>
