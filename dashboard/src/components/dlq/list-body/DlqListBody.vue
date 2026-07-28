<script setup lang="ts">
import { toRef } from 'vue';

import type { DlqEntry } from '@/types/dlq-entry.model';

import PanelEmptyState from '../../shared/ui/panel-empty-state/PanelEmptyState.vue';
import DlqItemRow from '../item-row/DlqItemRow.vue';
import { useDlqListState } from './composables/use-dlq-list-state';

const props = withDefaults(
  defineProps<{
    entries: DlqEntry[];
    selectedEntryId: string | null;
    error?: string | null;
    hideRead?: boolean;
    isEntryRead: (entry: DlqEntry) => boolean;
    entryReadKey: (entry: DlqEntry) => string;
  }>(),
  {
    error: null,
    hideRead: false,
  },
);

const emit = defineEmits<{
  (e: 'select', entry: DlqEntry): void;
  (e: 'retry', requestId: string): void;
  (e: 'archive', requestId: string): void;
  (e: 'delete', requestId: string): void;
}>();

const entriesRef = toRef(props, 'entries');
const hideReadRef = toRef(props, 'hideRead');

const { sortedEntries } = useDlqListState({
  entries: entriesRef,
  hideRead: hideReadRef,
  isEntryRead: props.isEntryRead,
  entryReadKey: props.entryReadKey,
});

function select(entry: DlqEntry) {
  emit('select', entry);
}
</script>

<template>
  <div v-if="props.error">
    <PanelEmptyState
      :message="props.error"
      submessage="Check network or server status"
    />
  </div>

  <div v-else-if="sortedEntries.length" class="dlq-list-body">
    <div
      v-for="entry in sortedEntries"
      :key="entry.requestId"
      class="dlq-list-body__row"
      :class="{
        'dlq-list-body__row--active': props.selectedEntryId === entry.requestId,
      }"
      @click="select(entry)"
    >
      <DlqItemRow
        :entry="entry"
        :is-read="props.isEntryRead(entry)"
        :is-active="props.selectedEntryId === entry.requestId"
        @retry="(requestId: string) => emit('retry', requestId)"
        @archive="emit('archive', $event)"
        @delete="emit('delete', $event)"
      />
    </div>
  </div>

  <PanelEmptyState
    v-else-if="props.entries.length === 0"
    message="No failed jobs"
    submessage="DLQ is empty"
  />
  <PanelEmptyState
    v-else
    message="No unread jobs"
    submessage="Toggle the eye icon to show all jobs"
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
