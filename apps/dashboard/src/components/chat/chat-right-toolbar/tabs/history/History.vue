<script setup lang="ts">
import ExpandableMessageList from '@/components/shared/ui/expandable-message-list/ExpandableMessageList.vue';
import { useAppStore } from '@/stores/app';
import { renderMarkdown } from '@/utils/render-markdown.helper';

import type { HistoryProps } from './History.types';

defineProps<HistoryProps>();

const emit = defineEmits<{
  promptClick: [index: number];
  copy: [index: number];
  toggleInclude: [index: number];
  toggleMerge: [index: number];
  deleteItem: [index: number];
  branchOut: [index: number];
}>();

const appStore = useAppStore();
</script>

<template>
  <div class="history">
    <ExpandableMessageList
      :items="messageListItems"
      :render-html="renderMarkdown"
      :active-id="activeUserExchangeId ?? null"
      :on-click="(i: number) => emit('promptClick', i)"
      :on-copy="(i: number) => emit('copy', i)"
      :on-toggle-include="(i: number) => emit('toggleInclude', i)"
      :on-toggle-merge="(i: number) => emit('toggleMerge', i)"
      :on-delete-item="(i: number) => emit('deleteItem', i)"
      :on-branch-out="(i: number) => emit('branchOut', i)"
      :expand-all="true"
      :show-role="false"
      :icon-visibility="appStore.chatIconVisibility"
      :can-merge="canMerge"
      :merge-armed="mergeArmed"
    />
  </div>
</template>

<style scoped>
.history {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}
</style>
