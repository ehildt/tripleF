<script setup lang="ts">
import ConversationList from './conversation-list/ConversationList.vue';
import type { ConversationsProps } from './Conversations.types';

defineProps<ConversationsProps>();

const emit = defineEmits<{
  selectConversation: [id: string];
  deleteConversation: [id: string];
  toggleConversationType: [id: string];
}>();
</script>

<template>
  <ConversationList
    :conversations="conversations"
    :active-conversation-id="activeConversationId"
    :temporary-retention-minutes="temporaryRetentionMinutes"
    @select-conversation="emit('selectConversation', $event)"
    @delete-conversation="emit('deleteConversation', $event)"
    @toggle-type="emit('toggleConversationType', $event)"
  />
</template>
