<script setup lang="ts">
import { Cloud, FileImage, History, X } from '@lucide/vue';
import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';

import { getApiUrl } from '../../../api/api-url';
import ExpandableMessageList from '../../shared/ui/expandable-message-list/ExpandableMessageList.vue';
import type { MessageListItem } from '../../shared/ui/expandable-message-list/types';
import type { AttachmentItem } from './composables/use-attachment-list';

const props = defineProps<{
  attachments: AttachmentItem[];
  messageListItems: MessageListItem[];
  rightPanelView: 'files' | 'history';
  conversation: Conversation | null;
}>();

const emit = defineEmits<{
  selectView: [view: 'files' | 'history'];
  removeAttachment: [id: string];
  toggleAttachment: [id: string];
  promptClick: [index: number];
}>();

const hasAttachments = computed(() => props.attachments.length > 0);
const hasHistory = computed(() => props.messageListItems.length > 0);

const filesTabClass = computed(() =>
  makeTabClass(props.rightPanelView === 'files'),
);
const historyTabClass = computed(() =>
  makeTabClass(props.rightPanelView === 'history'),
);

function makeTabClass(isActive: boolean) {
  return {
    'chat-right-panel__tab': true,
    'chat-right-panel__tab--active': isActive,
  };
}

function imageUrl(hash: string): string {
  if (!props.conversation?.id) return '';
  return getApiUrl(
    `/api/v1/storage/${props.conversation.id}/${props.conversation.conversationId}/${hash}`,
  );
}

function previewUrl(item: AttachmentItem): string {
  return item.isUploaded ? imageUrl(item.hash) : item.previewUrl;
}

function onPromptClick(idx: number) {
  emit('promptClick', idx);
}
</script>

<template>
  <div class="chat-right-panel">
    <div class="chat-right-panel__tabs">
      <button
        v-if="hasAttachments"
        :class="filesTabClass"
        @click="emit('selectView', 'files')"
      >
        <FileImage class="chat-right-panel__tab-icon" />
        Files
      </button>
      <button
        v-if="hasHistory"
        :class="historyTabClass"
        @click="emit('selectView', 'history')"
      >
        <History class="chat-right-panel__tab-icon" />
        History
      </button>
    </div>

    <div
      v-if="rightPanelView === 'files' && hasAttachments"
      class="chat-right-panel__scrollable"
    >
      <div
        v-for="item in attachments"
        :key="item.id"
        class="chat-right-panel__file-card"
        :class="{
          'chat-right-panel__file-card--unselected': !item.isSelected,
        }"
      >
        <div class="chat-right-panel__file-header">
          <span class="chat-right-panel__file-name">
            {{ item.name }}
          </span>
          <Cloud
            v-if="item.isUploaded"
            class="chat-right-panel__uploaded-indicator"
            title="Already uploaded and part of the conversation"
          />
          <button
            class="chat-right-panel__file-remove"
            title="Remove"
            @click.stop="emit('removeAttachment', item.id)"
          >
            <X class="chat-right-panel__file-remove-icon" />
          </button>
        </div>
        <div
          class="chat-right-panel__file-thumb"
          :class="{
            'chat-right-panel__file-thumb--unselected': !item.isSelected,
          }"
          @click="emit('toggleAttachment', item.id)"
        >
          <img
            :src="previewUrl(item)"
            class="chat-right-panel__file-image"
            :class="{
              'chat-right-panel__file-image--unselected': !item.isSelected,
            }"
            alt=""
            loading="lazy"
            decoding="async"
          />
        </div>
      </div>
    </div>

    <div v-if="rightPanelView === 'history'" class="chat-right-panel__history">
      <ExpandableMessageList
        :items="messageListItems"
        :on-click="onPromptClick"
        :expand-all="true"
        class="chat-right-panel__scrollable"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-right-panel {
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 11rem);
}

.chat-right-panel__tabs {
  display: flex;
  gap: var(--spacing-1);
  margin-bottom: var(--spacing-2);
}

.chat-right-panel__tab {
  flex: 1 1 0%;
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
  color: var(--color-fg-muted);
  background-color: transparent;
  border: none;
}

.chat-right-panel__tab:hover {
  color: var(--color-fg-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-right-panel__tab--active {
  color: var(--color-accent-primary);
  background-color: var(--color-bg-tertiary);
}

.chat-right-panel__tab-icon {
  display: inline;
  width: 0.75rem;
  height: 0.75rem;
  margin-right: var(--spacing-1);
  vertical-align: middle;
}

.chat-right-panel__scrollable {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.chat-right-panel__file-card {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  overflow: hidden;
  flex-shrink: 0;
  transition:
    opacity 250ms ease,
    filter 250ms ease;
}

.chat-right-panel__file-card--unselected {
  opacity: 0.6;
}

.chat-right-panel__file-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-bottom: 1px solid var(--color-divider);
}

.chat-right-panel__file-name {
  flex: 1 1 0%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-secondary);
}

.chat-right-panel__file-remove {
  padding: var(--spacing-0-5);
  color: var(--color-fg-muted);
  cursor: pointer;
  transition: color 0.2s ease;
  border: none;
  background-color: transparent;
  flex-shrink: 0;
}

.chat-right-panel__file-remove:hover {
  color: var(--color-status-error);
}

.chat-right-panel__file-remove-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.chat-right-panel__uploaded-indicator {
  width: 0.75rem;
  height: 0.75rem;
  color: var(--color-accent-primary);
  flex-shrink: 0;
}

.chat-right-panel__file-card--unselected {
  opacity: 0.6;
}

.chat-right-panel__file-thumb {
  cursor: pointer;
  transition: filter 250ms ease;
}

.chat-right-panel__file-thumb--unselected,
.chat-right-panel__file-thumb--unselected .chat-right-panel__file-image {
  filter: grayscale(100%);
}

.chat-right-panel__file-image {
  width: 100%;
  height: 8.875rem;
  object-fit: cover;
  transition: filter 250ms ease;
}

.chat-right-panel__file-image--unselected {
  filter: grayscale(100%);
}

.chat-right-panel__history {
  width: 100%;
}
</style>
