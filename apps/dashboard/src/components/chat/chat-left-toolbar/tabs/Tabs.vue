<script setup lang="ts">
import { MessagesSquare, Radio } from '@lucide/vue';
import { computed } from 'vue';

import Tab from '@/components/chat/shared/ui/tab/Tab.vue';
import { useLeftToolbarStore } from '@/stores/left-toolbar';
import { useModelsStore } from '@/stores/models';

import ConversationMenu from './conversations/conversation-menu/ConversationMenu.vue';
import Conversations from './conversations/Conversations.vue';
import Sockets from './sockets/Sockets.vue';
import StreamSettingsMenu from './sockets/stream-settings-menu/StreamSettingsMenu.vue';

const toolbarStore = useLeftToolbarStore();
const modelsStore = useModelsStore();

const isConversationMenuOpen = computed(() =>
  toolbarStore.isMenuOpen('conversation'),
);
const isStreamMenuOpen = computed(() => toolbarStore.isMenuOpen('stream'));

function toggleConversationMenu() {
  if (toolbarStore.hasNoModelSelected) return;
  const wasOpen = isConversationMenuOpen.value;
  toolbarStore.closeAllMenus();
  if (wasOpen) return;
  toolbarStore.openMenu('conversation');
  if (!modelsStore.models.length) modelsStore.fetchModels({ refresh: true });
}

function toggleStreamMenu() {
  if (toolbarStore.hasNoModelSelected) return;
  const wasOpen = isStreamMenuOpen.value;
  toolbarStore.closeAllMenus();
  if (!wasOpen) toolbarStore.openMenu('stream');
}

/** The plus opens its section's menu — and first selects that section so the
 *  menu context matches the list shown below it. */
function onConversationsPlus() {
  toolbarStore.selectLeftToolbarView('conversations');
  toggleConversationMenu();
}

function onSocketsPlus() {
  toolbarStore.selectLeftToolbarView('sockets');
  toggleStreamMenu();
}

function onCreate(type: 'temporary' | 'persistent') {
  toolbarStore.createConversation(type);
  toolbarStore.closeAllMenus();
}

function onSubscribeToEvent() {
  toolbarStore.subscribeToEvent(
    toolbarStore.newSubscriptionEvent,
    toolbarStore.newSubscriptionRoomId,
    toolbarStore.isStreamEnabled,
  );
}

function formatContextValue(value: string): string {
  return modelsStore.formatCtx(Number(value));
}
</script>

<template>
  <div class="tabs">
    <div class="tabs__strip">
      <Tab
        :is-active="toolbarStore.leftToolbarView === 'conversations'"
        :label="$t('common.conversations')"
        @select="toolbarStore.selectLeftToolbarView('conversations')"
      >
        <MessagesSquare />
        <template #menu>
          <ConversationMenu
            :is-open="isConversationMenuOpen"
            :is-disabled="toolbarStore.hasNoModelSelected"
            :blinking="toolbarStore.brainBlinking"
            :name="toolbarStore.newConversationName"
            :event="toolbarStore.newConversationEvent"
            :room-id="toolbarStore.newConversationRoomId"
            :num-ctx-value="
              toolbarStore.currentNumCtx || toolbarStore.defaultNumCtx
            "
            :context-options="toolbarStore.contextOptions"
            :format-context-value="formatContextValue"
            :available-events="toolbarStore.availableSocketEvents"
            :available-rooms="toolbarStore.availableRooms"
            @toggle-menu="onConversationsPlus"
            @close="toolbarStore.closeAllMenus"
            @mouseenter="toolbarStore.startBrainBlink"
            @mouseleave="toolbarStore.stopBrainBlink"
            @update:name="toolbarStore.newConversationName = $event"
            @update:event="toolbarStore.newConversationEvent = $event"
            @update:room-id="toolbarStore.newConversationRoomId = $event"
            @update:num-ctx="toolbarStore.selectNumCtx"
            @create="onCreate"
          />
        </template>
      </Tab>

      <Tab
        v-if="toolbarStore.areSocketsVisible"
        :is-active="toolbarStore.leftToolbarView === 'sockets'"
        :label="$t('common.sockets')"
        @select="toolbarStore.selectLeftToolbarView('sockets')"
      >
        <Radio />
        <template #menu>
          <StreamSettingsMenu
            :is-open="isStreamMenuOpen"
            :is-disabled="toolbarStore.hasNoModelSelected"
            :is-stream-enabled="toolbarStore.isStreamEnabled"
            :new-event="toolbarStore.newSubscriptionEvent"
            :new-room-id="toolbarStore.newSubscriptionRoomId"
            :blinking="toolbarStore.brainBlinking"
            @toggle-menu="onSocketsPlus"
            @close="toolbarStore.closeAllMenus"
            @mouseenter="toolbarStore.startBrainBlink"
            @mouseleave="toolbarStore.stopBrainBlink"
            @update:is-stream-enabled="toolbarStore.isStreamEnabled = $event"
            @update:new-event="toolbarStore.newSubscriptionEvent = $event"
            @update:new-room-id="toolbarStore.newSubscriptionRoomId = $event"
            @subscribe-to-event="onSubscribeToEvent"
          />
        </template>
      </Tab>
    </div>

    <Conversations v-if="toolbarStore.leftToolbarView === 'conversations'" />
    <Sockets v-else-if="toolbarStore.leftToolbarView === 'sockets'" />
  </div>
</template>

<style scoped>
.tabs {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  width: 100%;
}

.tabs__strip {
  display: flex;
  gap: var(--spacing-1);
  width: 100%;
}
</style>
