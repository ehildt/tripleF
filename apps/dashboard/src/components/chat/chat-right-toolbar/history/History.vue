<script setup lang="ts">
import { useAppStore } from '@/stores/app';

import { useHistoryPanel } from './composables/use-history-panel';
import HistoryList from './history-list/HistoryList.vue';

const appStore = useAppStore();

const {
  messageListItems,
  activeUserExchangeId,
  canMerge,
  mergeArmed,
  onPromptClick,
  onCopy,
  toggleUserExchangeIncluded,
  toggleUserExchangeMerge,
  deleteUserExchange,
  branchUserExchange,
} = useHistoryPanel();
</script>

<template>
  <div class="history">
    <HistoryList
      :items="messageListItems"
      :active-id="activeUserExchangeId ?? null"
      :icon-visibility="appStore.chatIconVisibility"
      :can-merge="canMerge"
      :merge-armed="mergeArmed"
      @select="onPromptClick"
      @copy="onCopy"
      @toggle-include="toggleUserExchangeIncluded"
      @toggle-merge="toggleUserExchangeMerge"
      @delete-item="deleteUserExchange"
      @branch-out="branchUserExchange"
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
