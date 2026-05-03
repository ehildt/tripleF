<script setup lang="ts">
import { computed } from 'vue';

import type { Conversation } from '@/stores/conversation';

import ExpandableList from '../shared/ExpandableList.vue';
import ConversationItem from './conversation-item/ConversationItem.vue';
import { formatContextUsagePercent } from './helpers/format-context-usage-percent.helper';
import { formatConversationExpiry } from './helpers/format-conversation-expiry.helper';

const props = defineProps<{
  conversations: readonly Conversation[];
  activeConversationId: string | null;
  isExpanded: boolean;
}>();

defineEmits<{
  'toggle-expanded': [];
  'select-conversation': [id: string];
  'delete-conversation': [id: string];
}>();

const sortedConversations = computed(() =>
  [...props.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
);
</script>

<template>
  <ExpandableList
    v-if="conversations.length"
    :is-expanded="isExpanded"
    :has-items="true"
    @toggle-expanded="$emit('toggle-expanded')"
  >
    <ConversationItem
      v-for="c in sortedConversations"
      :key="c.id"
      :conversation="c"
      :is-active="c.id === activeConversationId"
      :context-usage-percent="
        formatContextUsagePercent(c.exchanges, c.numCtx || '')
      "
      :expires-label="formatConversationExpiry(c.updatedAt)"
      @select="$emit('select-conversation', c.id)"
      @delete="$emit('delete-conversation', c.id)"
    />
  </ExpandableList>
</template>

<style scoped></style>
