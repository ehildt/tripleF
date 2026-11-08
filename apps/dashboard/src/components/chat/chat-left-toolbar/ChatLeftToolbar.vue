<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { onDeactivated } from 'vue';

import { useConversationCatalog } from '@/components/chat/composables/use-conversation-catalog';
import { useConversationStore } from '@/stores/chat/conversation/conversation.store';
import { useConversationSettingsStore } from '@/stores/chat/conversation-settings/conversation-settings.store';

import CapabilitiesRow from './capabilities-row/CapabilitiesRow.vue';
import { useDeleteConversation } from './composables/use-delete-conversation';
import { useLeftToolbarMenus } from './composables/use-left-toolbar-menus';
import { useSelectedModel } from './composables/use-selected-model';
import { useSocketSubscriptions } from './composables/use-socket-subscriptions';
import SelectedModelLabel from './selected-model-label/SelectedModelLabel.vue';
import Tabs from './tabs/Tabs.vue';

const { closeAllMenus } = useLeftToolbarMenus();
const { selectedModelName, isModelMissing, selectedModelCapabilities } =
  useSelectedModel();
const {
  subscriptions,
  conversationNamesByEvent,
  toggleSubscriptionActive,
  toggleSubscriptionStream,
  removeSubscription,
} = useSocketSubscriptions();
const { deleteConversation } = useDeleteConversation();

const conversationStore = useConversationStore();
const conversationSettingsStore = useConversationSettingsStore();
const { conversations, activeConversationId } = storeToRefs(conversationStore);
const { setActiveConversation, toggleConversationType } =
  useConversationCatalog();
const { temporaryRetentionMinutes } = storeToRefs(conversationSettingsStore);

// KeepAlive deactivates the chat tree on a tab switch — close any open menus
// so they never linger while another tab is on screen. The menu state is
// shared with the prompt-menu, so clearing it here closes those too.
onDeactivated(closeAllMenus);
</script>

<template>
  <div class="chat-left-toolbar">
    <SelectedModelLabel
      :selected-model-name="selectedModelName"
      :is-model-missing="isModelMissing"
    />
    <CapabilitiesRow
      v-if="selectedModelCapabilities.length"
      :capabilities="selectedModelCapabilities"
    />
    <Tabs
      :conversations="conversations"
      :active-conversation-id="activeConversationId"
      :temporary-retention-minutes="temporaryRetentionMinutes"
      :subscriptions="subscriptions"
      :conversation-names-by-event="conversationNamesByEvent"
      @select-conversation="setActiveConversation"
      @delete-conversation="deleteConversation"
      @toggle-conversation-type="toggleConversationType"
      @toggle-subscription-active="toggleSubscriptionActive"
      @toggle-subscription-stream="toggleSubscriptionStream"
      @remove-subscription="removeSubscription"
    />
  </div>
</template>

<style scoped>
.chat-left-toolbar {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--spacing-2);
}
</style>
