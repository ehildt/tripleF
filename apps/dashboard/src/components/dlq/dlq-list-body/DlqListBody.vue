<script setup lang="ts">
import { toRef } from 'vue';

import PanelEmptyState from '@/components/shared/ui/panel-empty-state/PanelEmptyState.vue';
import type { DlqEntry } from '@/types/dlq-entry.model';

import DlqItemRow from '../dlq-item-row/DlqItemRow.vue';
import { useDlqListState } from './composables/use-dlq-list-state';
import type { DlqListBodyProps } from './DlqListBody.types';

const props = withDefaults(defineProps<DlqListBodyProps>(), {
  error: null,
  hideRead: false,
});

const emit = defineEmits<{
  (e: 'select', entry: DlqEntry): void;
  (e: 'retry', id: string): void;
  (e: 'archive', id: string): void;
  (e: 'delete', id: string): void;
}>();

const entriesRef = toRef(props, 'entries');
const hideReadRef = toRef(props, 'hideRead');

const { sortedEntries } = useDlqListState({
  entries: entriesRef,
  hideRead: hideReadRef,
  isEntryRead: props.isEntryRead,
  entryReadKey: props.entryReadKey,
});
</script>

<template>
  <PanelEmptyState v-if="props.error" :message="props.error" :submessage="''" />

  <div v-if="!props.error && sortedEntries.length > 0" class="dlq-list-body">
    <div
      v-for="entry in sortedEntries"
      :key="entry.id"
      class="dlq-list-body__row"
      :class="{
        'dlq-list-body__row--active': props.selectedEntryId === entry.id,
      }"
      @click="emit('select', entry)"
    >
      <DlqItemRow
        :entry="entry"
        :is-read="props.isEntryRead(entry)"
        :is-active="props.selectedEntryId === entry.id"
        @retry="(id: string) => emit('retry', id)"
        @archive="emit('archive', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>

  <PanelEmptyState
    v-if="
      !props.error && sortedEntries.length === 0 && props.entries.length === 0
    "
    :message="$t('common.noFailedJobs')"
    :submessage="''"
  />
  <PanelEmptyState
    v-if="
      !props.error && sortedEntries.length === 0 && props.entries.length > 0
    "
    :message="$t('common.noUnreadJobs')"
    :submessage="''"
  />
</template>

<style scoped>
/* Fills the column panel (flex parent) and scrolls internally — the
   column wrapper in Dlq.vue owns the shared panel height. */
.dlq-list-body {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.dlq-list-body__row {
  cursor: pointer;
}

.dlq-list-body__row--active {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 15%,
    transparent
  );
}
</style>
