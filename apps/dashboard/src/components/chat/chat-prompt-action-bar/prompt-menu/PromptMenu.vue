<script setup lang="ts">
import { usePromptMenu } from './composables/use-prompt-menu';
import ConversationMenu from './conversation-menu/ConversationMenu.vue';
import ModelSelector from './model-selector/ModelSelector.vue';
import StreamSettingsMenu from './stream-settings-menu/StreamSettingsMenu.vue';

const {
  areSocketsVisible,
  isModelMenuOpen,
  isConversationMenuOpen,
  isStreamMenuOpen,
  hasNoModelSelected,
  selectedModelName,
  localModels,
  cloudModels,
  modelsLoading,
  newSubscriptionStreamEnabled,
  newSubscriptionEvent,
  newSubscriptionRoomId,
  newConversationName,
  newConversationEvent,
  newConversationRoomId,
  numCtxValue,
  contextOptions,
  formatContextValue,
  availableSocketEvents,
  availableRooms,
  closeAllMenus,
  toggleModelMenu,
  toggleChatMenu,
  toggleSocketsMenu,
  selectNumCtx,
  selectModelAndCloseMenu,
  createConversationAndCloseMenu,
  subscribeToEventAndCloseMenu,
  triggerBlinking,
  startTriggerBlink,
  stopTriggerBlink,
} = usePromptMenu();
</script>

<template>
  <div class="prompt-menu">
    <div class="prompt-menu__menus">
      <ModelSelector
        :is-open="isModelMenuOpen"
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
        :blinking="triggerBlinking"
        :num-ctx-value="numCtxValue"
        :context-options="contextOptions"
        :format-context-value="formatContextValue"
        :available-events="availableSocketEvents"
        :available-rooms="availableRooms"
        @toggle-menu="toggleChatMenu"
        @close="closeAllMenus"
        @mouseenter="startTriggerBlink"
        @mouseleave="stopTriggerBlink"
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
        :blinking="triggerBlinking"
        @toggle-menu="toggleSocketsMenu"
        @close="closeAllMenus"
        @mouseenter="startTriggerBlink"
        @mouseleave="stopTriggerBlink"
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
