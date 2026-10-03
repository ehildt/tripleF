<script setup lang="ts">
import { MessageSquare } from '@lucide/vue';
import { computed } from 'vue';

import ToolbarMenuTrigger from '@/components/chat/chat-prompt-action-bar/prompt-menu/shared/ui/toolbar-menu-trigger/ToolbarMenuTrigger.vue';

import ConversationActionButtons from './conversation-action-buttons/ConversationActionButtons.vue';
import ConversationContextSelect from './conversation-context-select/ConversationContextSelect.vue';
import ConversationEventSelect from './conversation-event-select/ConversationEventSelect.vue';
import ConversationNameInput from './conversation-name-input/ConversationNameInput.vue';
import ConversationRoomSelect from './conversation-room-select/ConversationRoomSelect.vue';
import { hasConversationName } from './helpers/has-conversation-name.helper';
import type { ConversationMenuProps } from './ConversationMenu.types';

const props = defineProps<ConversationMenuProps>();

const emit = defineEmits<{
  toggleMenu: [];
  close: [];
  mouseenter: [];
  mouseleave: [];
  'update:name': [value: string];
  'update:event': [value: string];
  'update:roomId': [value: string];
  'update:numCtx': [value: string];
  create: [type: 'temporary' | 'persistent'];
}>();

const canCreate = computed(() => hasConversationName(props.name));

/** Pressing Enter in the name field creates a temporary conversation — the
 *  same as clicking the "temporary" button. */
function onSubmitTemporary() {
  if (!canCreate.value) return;
  emit('create', 'temporary');
}

function onCreate(type: 'temporary' | 'persistent') {
  emit('create', type);
}
</script>

<template>
  <ToolbarMenuTrigger
    :is-open="isOpen"
    :is-disabled="isDisabled"
    :blinking="blinking"
    :title="$t('common.newChatTooltip')"
    :trigger-icon="MessageSquare"
    @toggle-menu="emit('toggleMenu')"
    @close="emit('close')"
    @mouseenter="emit('mouseenter')"
    @mouseleave="emit('mouseleave')"
  >
    <div class="conversation-menu__content">
      <ConversationNameInput
        :model-value="name"
        :placeholder="$t('common.conversationName')"
        @update:model-value="emit('update:name', $event)"
        @submit="onSubmitTemporary"
      />
      <ConversationContextSelect
        :model-value="numCtxValue"
        :options="contextOptions"
        :format-value="formatContextValue"
        @update:model-value="emit('update:numCtx', $event)"
      />
      <ConversationEventSelect
        :model-value="event"
        :options="availableEvents"
        @update:model-value="emit('update:event', $event)"
      />
      <ConversationRoomSelect
        :model-value="roomId"
        :options="availableRooms"
        @update:model-value="emit('update:roomId', $event)"
      />
      <ConversationActionButtons :can-create="canCreate" @create="onCreate" />
    </div>
  </ToolbarMenuTrigger>
</template>

<style scoped>
.conversation-menu__content {
  padding: var(--spacing-1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}
</style>
