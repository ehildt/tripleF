<script setup lang="ts">
import { useConversationStore } from '@/stores/conversation';
import { useLeftToolbarStore } from '@/stores/left-toolbar';

import ConversationList from './conversation-list/ConversationList.vue';

const toolbarStore = useLeftToolbarStore();
const conversationStore = useConversationStore();
</script>

<template>
  <ConversationList
    v-if="toolbarStore.hasConversations"
    :conversations="conversationStore.conversations"
    :active-conversation-id="conversationStore.activeConversationId"
    @select-conversation="conversationStore.setActiveConversation"
    @delete-conversation="toolbarStore.deleteConversation"
    @toggle-type="conversationStore.toggleConversationType"
  />
</template>
