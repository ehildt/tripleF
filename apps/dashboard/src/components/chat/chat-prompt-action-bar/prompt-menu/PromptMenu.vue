<script setup lang="ts">
import { useContextSize } from '@/components/chat/chat-left-toolbar/composables/use-context-size';
import { useLeftToolbarMenus } from '@/components/chat/chat-left-toolbar/composables/use-left-toolbar-menus';
import { useNewConversationForm } from '@/components/chat/chat-left-toolbar/composables/use-new-conversation-form';
import { useNewSocketForm } from '@/components/chat/chat-left-toolbar/composables/use-new-socket-form';
import { useSelectedModel } from '@/components/chat/chat-left-toolbar/composables/use-selected-model';
import { useLeftToolbarView } from '@/components/chat/chat-left-toolbar/tabs/composables/use-left-toolbar-view';

import { usePromptMenu } from './composables/use-prompt-menu';
import ConversationMenu from './conversation-menu/ConversationMenu.vue';
import ModelSelector from './model-selector/ModelSelector.vue';
import StreamSettingsMenu from './stream-settings-menu/StreamSettingsMenu.vue';

const {
  isModelMenuOpen,
  isConversationMenuOpen,
  isStreamMenuOpen,
  closeAllMenus,
  toggleModelMenu,
} = useLeftToolbarMenus();

const {
  hasNoModelSelected,
  selectedModelName,
  localModels,
  cloudModels,
  modelsLoading,
} = useSelectedModel();

const { contextOptions, selectNumCtx } = useContextSize();

const {
  newSubscriptionStreamEnabled,
  newSubscriptionEvent,
  newSubscriptionRoomId,
} = useNewSocketForm();

const {
  newConversationName,
  newConversationEvent,
  newConversationRoomId,
  availableSocketEvents,
  availableRooms,
} = useNewConversationForm();

const { areSocketsVisible } = useLeftToolbarView();

const {
  numCtxValue,
  hasNoActiveConversation,
  toggleChatMenu,
  toggleSocketsMenu,
  selectModelAndCloseMenu,
  createConversationAndCloseMenu,
  subscribeToEventAndCloseMenu,
} = usePromptMenu();
</script>

<template>
  <div class="prompt-menu">
    <div class="prompt-menu__menus">
      <ModelSelector
        :is-open="isModelMenuOpen"
        :has-no-model-selected="hasNoModelSelected"
        :selected-model-name="selectedModelName"
        :local-models="localModels"
        :cloud-models="cloudModels"
        :is-loading="modelsLoading"
        @toggle-menu="toggleModelMenu"
        @select-model="selectModelAndCloseMenu"
        @close="closeAllMenus"
      />
      <ConversationMenu
        v-model:name="newConversationName"
        v-model:event="newConversationEvent"
        v-model:room-id="newConversationRoomId"
        :is-open="isConversationMenuOpen"
        :is-disabled="hasNoModelSelected"
        :has-no-active-conversation="hasNoActiveConversation"
        :num-ctx-value="numCtxValue"
        :context-options="contextOptions"
        :available-events="availableSocketEvents"
        :available-rooms="availableRooms"
        @toggle-menu="toggleChatMenu"
        @close="closeAllMenus"
        @update:num-ctx="selectNumCtx"
        @create="createConversationAndCloseMenu"
      />
      <StreamSettingsMenu
        v-if="areSocketsVisible"
        v-model:is-stream-enabled="newSubscriptionStreamEnabled"
        v-model:new-event="newSubscriptionEvent"
        v-model:new-room-id="newSubscriptionRoomId"
        :is-open="isStreamMenuOpen"
        :is-disabled="hasNoModelSelected"
        @toggle-menu="toggleSocketsMenu"
        @close="closeAllMenus"
        @subscribe-to-event="subscribeToEventAndCloseMenu"
      />
    </div>
    <!-- Second cluster of the left strip (the prompt-actions buttons), wired
         and slotted by the bar — same group gap the right strip uses between
         the sources menu and the view menu. -->
    <slot />
  </div>
</template>

<style scoped>
/* Mirrors the source-tags-strip on the right: floating on the prompt area's
   top border, but aligned left. Holds two clusters — the menu triggers and
   the slotted prompt-actions — with the same 1.2rem group gap the right
   strip uses between its menus. The z-index + pointer-events keep the strip
   clickable: without them the overlapping exchange content swallows the
   clicks before the buttons. */
.prompt-menu {
  position: absolute;
  top: 0;
  left: 1.1rem;
  z-index: 10;
  pointer-events: auto;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 0 var(--spacing-1);
}

.prompt-menu__menus {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}
</style>
