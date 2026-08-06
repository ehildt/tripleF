<script setup lang="ts">
import { MessagesSquare } from '@lucide/vue';
import { computed, nextTick, ref, watch } from 'vue';

import { useConversationStore } from '@/stores/conversation';

import { calcTotalContextPercentage } from '../shared/helpers/calc-token-percent.helper';
import ContextUsageIndicator from './context-usage-indicator/ContextUsageIndicator.vue';
import ConversationHeaderActions from './conversation-header-actions/ConversationHeaderActions.vue';
import ConversationTitleEditor from './conversation-title-editor/ConversationTitleEditor.vue';

const props = defineProps<{
  title: string;
  conversationId: string;
  count?: number;
}>();

const emit = defineEmits<{
  delete: [id: string];
}>();

const conversationStore = useConversationStore();

const tokenPercent = computed(() => {
  const conversation = conversationStore.getConversation(props.conversationId);
  if (!conversation) return null;
  return calcTotalContextPercentage(
    conversation.exchanges,
    conversation.numCtx ?? '',
  );
});

const conversationType = computed(() => {
  const conversation = conversationStore.getConversation(props.conversationId);
  return conversation?.type ?? 'temporary';
});

const editing = ref(false);
const editTitle = ref('');

watch(
  () => props.title,
  (t) => {
    editTitle.value = t;
  },
  { immediate: true },
);

function startRename() {
  editing.value = true;
  nextTick(() => {
    const input = document.querySelector<HTMLInputElement>(
      '[data-rename-input]',
    );
    input?.focus();
    input?.select();
  });
}

function commitRename() {
  if (editTitle.value.trim()) {
    conversationStore.renameConversation(
      props.conversationId,
      editTitle.value.trim(),
    );
  }
  editing.value = false;
}

function onRenameKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') commitRename();
  else if (e.key === 'Escape') editing.value = false;
}

function onDelete() {
  emit('delete', props.conversationId);
}

function toggleType() {
  conversationStore.toggleConversationType(props.conversationId);
}
</script>

<template>
  <div class="chat-conversation-header">
    <MessagesSquare class="chat-conversation-header__icon" />
    <ConversationTitleEditor
      v-if="editing"
      v-model="editTitle"
      @keydown="onRenameKeydown"
      @blur="commitRename"
    />
    <span v-else class="chat-conversation-header__title">{{ title }}</span>

    <ContextUsageIndicator :percent="tokenPercent" />

    <ConversationHeaderActions
      :conversation-type="conversationType"
      @rename="startRename"
      @delete="onDelete"
      @toggle-type="toggleType"
    />
  </div>
</template>

<style scoped>
.chat-conversation-header {
  display: flex;
  align-items: center;
  padding: var(--spacing-1) var(--spacing-2);
  gap: var(--spacing-2);
  background-color: var(--color-bg-secondary);
  border-bottom: 1px solid var(--color-divider);
  font-family: var(--font-mono);
}

.chat-conversation-header__icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-tab-rest);
  flex-shrink: 0;
}

.chat-conversation-header__title {
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  color: var(--color-tab-rest);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
