<script setup lang="ts">
import { Layers } from 'lucide-vue-next';
import { computed, ref } from 'vue';

import type { VisionDlq } from '../../types/vision-dlq.model';
import DebugPanelEmptyState from '../debug/DebugPanel.EmptyState.vue';
import DebugPanelHeaderTitle from '../debug/DebugPanel.Header.Title.vue';
import DebugPanelHeader from '../debug/DebugPanel.Header.vue';
import DebugPanelLayout from '../debug/DebugPanel.Layout.vue';
import DlqPanelItem from './DlqPanel.Item.vue';

const props = defineProps<{
  entries: VisionDlq[];
  selectedEntryId: string | null;
  error?: string | null;
  selectedCount?: number;
  selectedRequestIds: Set<string>;
}>();

const emit = defineEmits<{
  (e: 'select', entry: VisionDlq): void;
  (e: 'toggleSelection', requestId: string): void;
  (e: 'setAllSelected', selected: boolean): void;
  (e: 'retry', requestId: string): void;
  (e: 'archive', requestId: string): void;
  (e: 'delete', requestId: string): void;
  (e: 'reinstateSelected', source: string): void;
}>();

const source = ref('REST');

const allSelected = computed(
  () =>
    props.entries.length > 0 &&
    props.entries.every((e) => props.selectedRequestIds.has(e.requestId)),
);

function toggleAll() {
  emit('setAllSelected', !allSelected.value);
}

function select(entry: VisionDlq) {
  emit('select', entry);
}
</script>

<template>
  <DebugPanelLayout class="h-full">
    <DebugPanelHeader>
      <div class="flex items-center gap-3">
        <label class="flex items-center cursor-pointer">
          <input
            type="checkbox"
            :checked="allSelected"
            class="dlq-checkbox"
            @change="toggleAll"
          />
        </label>
        <DebugPanelHeaderTitle label="Failed Jobs" />
        <span
          v-if="selectedCount && selectedCount > 0"
          class="text-[10px] font-mono text-accent-primary"
          >({{ selectedCount }} selected)</span
        >
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-1">
          <button
            class="px-2 py-0.5 text-xs font-mono border transition-all duration-300"
            :class="
              source === 'REST'
                ? 'bg-tab-rest text-fg-inverse border-tab-rest z-10'
                : 'border-tab-rest/40 text-tab-rest/60 hover:border-tab-rest/80 hover:text-tab-rest hover:z-10'
            "
            @click="source = 'REST'"
          >
            RST
          </button>
          <button
            class="px-2 py-0.5 text-xs font-mono border transition-all duration-300"
            :class="
              source === 'MCP'
                ? 'bg-tab-mcp text-fg-inverse border-tab-mcp z-10'
                : 'border-tab-mcp/40 text-tab-mcp/60 hover:border-tab-mcp/80 hover:text-tab-mcp hover:z-10'
            "
            @click="source = 'MCP'"
          >
            MCP
          </button>
        </div>
        <button
          class="px-2 py-0.5 text-xs font-mono border border-(--color-tab-debug)/40 text-(--color-tab-debug) hover:bg-(--color-tab-debug)/10 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
          :disabled="!selectedCount"
          @click="$emit('reinstateSelected', source)"
        >
          <Layers class="w-3 h-3" /> REIN
        </button>
      </div>
    </DebugPanelHeader>

    <div v-if="error">
      <DebugPanelEmptyState
        :message="error"
        submessage="Check network or server status"
      />
    </div>

    <div v-else-if="entries.length">
      <div
        v-for="entry in entries"
        :key="entry.requestId"
        :class="{
          'bg-tertiary/50': selectedEntryId === entry.requestId,
        }"
        @click="select(entry)"
      >
        <DlqPanelItem
          :entry="entry"
          :is-selected="selectedRequestIds.has(entry.requestId)"
          @toggle-selection="$emit('toggleSelection', $event)"
          @retry="$emit('retry', $event)"
          @archive="$emit('archive', $event)"
          @delete="$emit('delete', $event)"
        />
      </div>
    </div>

    <DebugPanelEmptyState
      v-else
      message="No failed jobs"
      submessage="DLQ is empty"
    />
  </DebugPanelLayout>
</template>
