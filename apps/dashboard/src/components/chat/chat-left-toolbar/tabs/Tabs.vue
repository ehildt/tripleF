<script setup lang="ts">
import { MessagesSquare, Radio } from '@lucide/vue';
import { defineEmits, defineProps } from 'vue';

import Tab from '@/components/chat/shared/ui/tab/Tab.vue';

import { useLeftToolbarView } from './composables/use-left-toolbar-view';
import Conversations from './conversations/Conversations.vue';
import Sockets from './sockets/Sockets.vue';
import type { TabsProps } from './Tabs.types';

defineProps<TabsProps>();

const emit = defineEmits<{
  selectConversation: [id: string];
  deleteConversation: [id: string];
  toggleConversationType: [id: string];
  toggleSubscriptionActive: [index: number];
  toggleSubscriptionStream: [index: number];
  removeSubscription: [index: number];
}>();

const { leftToolbarView, selectLeftToolbarView, areSocketsVisible } =
  useLeftToolbarView();
</script>

<template>
  <div class="tabs">
    <div class="tabs__strip">
      <div class="tabs__group">
        <Tab
          :is-active="leftToolbarView === 'conversations'"
          :label="$t('common.conversations')"
          @select="selectLeftToolbarView('conversations')"
        >
          <MessagesSquare />
        </Tab>
      </div>

      <div v-if="areSocketsVisible" class="tabs__group">
        <Tab
          :is-active="leftToolbarView === 'sockets'"
          :label="$t('common.sockets')"
          @select="selectLeftToolbarView('sockets')"
        >
          <Radio />
        </Tab>
      </div>
    </div>

    <Conversations
      v-if="leftToolbarView === 'conversations' && conversations.length"
      :conversations="conversations"
      :active-conversation-id="activeConversationId"
      :temporary-retention-minutes="temporaryRetentionMinutes"
      @select-conversation="emit('selectConversation', $event)"
      @delete-conversation="emit('deleteConversation', $event)"
      @toggle-conversation-type="emit('toggleConversationType', $event)"
    />
    <Sockets
      v-else-if="leftToolbarView === 'sockets' && subscriptions.length"
      :subscriptions="subscriptions"
      :conversation-names-by-event="conversationNamesByEvent"
      @toggle-active="emit('toggleSubscriptionActive', $event)"
      @toggle-stream="emit('toggleSubscriptionStream', $event)"
      @remove-subscription="emit('removeSubscription', $event)"
    />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  width: 100%;
}

.tabs__strip {
  display: flex;
  gap: var(--spacing-0-5);
  width: 100%;
}

.tabs__group {
  background-color: var(--color-bg-secondary);
  flex: 1 1 0%;
  display: flex;
  align-items: center;
  min-width: 0;
}
</style>
