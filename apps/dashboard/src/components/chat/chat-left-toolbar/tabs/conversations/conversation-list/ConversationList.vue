<script setup lang="ts">
import { computed } from 'vue';

import { calcTotalContextPercentage } from '@/components/chat/shared/helpers/calc-token-percent.helper';
import { useAppStore } from '@/stores/app';
import type { Conversation } from '@/stores/conversation';

import ConversationItem from './conversation-item/ConversationItem.vue';
import { formatContextUsagePercent } from './helpers/format-context-usage-percent.helper';
import { formatConversationExpiry } from './helpers/format-conversation-expiry.helper';
import type { ConversationListProps } from './ConversationList.types';

const props = defineProps<ConversationListProps>();

defineEmits<{
  'select-conversation': [id: string];
  'delete-conversation': [id: string];
  'toggle-type': [id: string];
}>();

const appStore = useAppStore();

const sortedConversations = computed(() =>
  [...props.conversations].sort((a, b) => b.updatedAt - a.updatedAt),
);

/**
 * Context usage is derived live from each conversation's exchanges so the
 * sidebar stays in sync as turns complete. Only the active conversation is
 * hydrated with token data, so for the rest we fall back to the stored
 * contextUsagePercent from the server snapshot (refreshed on save).
 */
function contextUsagePercent(c: Conversation): string | null {
  return formatContextUsagePercent(
    calcTotalContextPercentage(c.exchanges, c.numCtx) ?? c.contextUsagePercent,
  );
}
</script>

<template>
  <div v-if="conversations.length" class="conversation-list">
    <ConversationItem
      v-for="c in sortedConversations"
      :key="c.id"
      :conversation="c"
      :is-active="c.id === activeConversationId"
      :context-usage-percent="contextUsagePercent(c)"
      :expires-label="
        formatConversationExpiry(
          c.updatedAt,
          appStore.temporaryRetentionMinutes,
        )
      "
      @select="$emit('select-conversation', c.id)"
      @delete="$emit('delete-conversation', c.id)"
      @toggle-type="$emit('toggle-type', c.id)"
    />
  </div>
</template>

<style scoped>
.conversation-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-0-5);
  width: 100%;
  min-width: 0;
  overflow-y: auto;
  max-height: calc(10 * 3.5rem);
}
</style>
