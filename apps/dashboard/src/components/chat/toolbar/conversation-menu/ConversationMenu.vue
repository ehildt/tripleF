<script setup lang="ts">
import { computed } from 'vue';

import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';
import { useConversationMenu } from './composables/use-conversation-menu';
import ConversationActionButtons from './conversation-action-buttons/ConversationActionButtons.vue';
import ConversationContextSelect from './conversation-context-select/ConversationContextSelect.vue';
import ConversationEventSelect from './conversation-event-select/ConversationEventSelect.vue';
import ConversationMenuTrigger from './conversation-menu-trigger/ConversationMenuTrigger.vue';
import ConversationNameInput from './conversation-name-input/ConversationNameInput.vue';
import ConversationRoomSelect from './conversation-room-select/ConversationRoomSelect.vue';
import { hasConversationName } from './helpers/has-conversation-name.helper';
import type { ConversationMenuProps } from './ConversationMenu.types';

defineProps<ConversationMenuProps>();

const emit = defineEmits<{
  toggleMenu: [];
  created: [];
}>();

const {
  newConversationName,
  newConversationEvent,
  newConversationRoomId,
  hasNoModelSelected,
  availableSocketEvents,
  availableRooms,
  contextOptions,
  currentNumCtx,
  defaultNumCtx,
  formatCtx,
  selectNumCtx,
  createConversation,
} = useConversationMenu();

const canCreate = computed(() =>
  hasConversationName(newConversationName.value),
);

/** Pressing Enter in the name field creates a temporary conversation — the
 *  same as clicking the "temporary" button. */
function onCreateTemporary() {
  if (!hasConversationName(newConversationName.value)) return;
  createConversation('temporary');
  emit('created');
}

function onCreate(type: 'temporary' | 'persistent') {
  createConversation(type);
  emit('created');
}
</script>

<template>
  <div class="conversation-menu">
    <ToolbarLabel value="conversations" translate />
    <ConversationMenuTrigger
      :is-open="isOpen"
      :is-disabled="hasNoModelSelected"
      :blinking="blinking"
      :on-mouse-enter="onMouseEnter"
      :on-mouse-leave="onMouseLeave"
      @toggle-menu="$emit('toggleMenu')"
    >
      <div class="conversation-menu__content">
        <ConversationNameInput
          v-model="newConversationName"
          :placeholder="$t('common.conversationName')"
          @submit="onCreateTemporary"
        />
        <ConversationContextSelect
          :model-value="currentNumCtx || defaultNumCtx"
          :options="contextOptions"
          :format-value="(value: string) => formatCtx(Number(value))"
          @update:model-value="selectNumCtx"
        />
        <ConversationEventSelect
          v-model="newConversationEvent"
          :options="availableSocketEvents"
        />
        <ConversationRoomSelect
          v-model="newConversationRoomId"
          :options="availableRooms"
        />
        <ConversationActionButtons :can-create="canCreate" @create="onCreate" />
      </div>
    </ConversationMenuTrigger>
  </div>
</template>

<style scoped>
.conversation-menu {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  justify-content: flex-end;
  padding: var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
  background-color: var(--color-bg-secondary);
  width: 100%;
}

.conversation-menu__content {
  padding: var(--spacing-1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
