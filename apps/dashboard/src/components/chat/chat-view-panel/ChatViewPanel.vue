<script setup lang="ts">
import { computed } from 'vue';

import { useAppStore } from '@/stores/app';

import { useActiveConversation } from './composables/use-active-conversation';
import { useExchangeActions } from './composables/use-exchange-actions';
import { useExchangeVisualState } from './composables/use-exchange-visual-state';
import ExchangeSkeleton from './exchange-skeleton/ExchangeSkeleton.vue';
import { buildExchangeSections } from './helpers/build-exchange-sections.helper';
import NoConversationPanel from './no-conversation-panel/NoConversationPanel.vue';
import ScrollableExchangeList from './scrollable-exchange-list/ScrollableExchangeList.vue';
import type { ChatViewPanelProps } from './ChatViewPanel.types';

const props = defineProps<ChatViewPanelProps>();

const emit = defineEmits<{
  deleteConversation: [id: string];
  scroll: [];
}>();

const {
  activeConversation,
  exchanges,
  activeAssistantExchangeId,
  activeAssistantResponseStarted,
  isExchangesLoading,
} = useActiveConversation();

const { highlightedIds, collapsedIds } = useExchangeVisualState(exchanges);

const isCompact = computed(() => props.compact ?? false);

const sections = computed(() => buildExchangeSections(exchanges.value));

const { retryExchange } = useExchangeActions(props.retryHandler);

const appStore = useAppStore();

const isSessionActive = computed(() => activeConversation.value !== null);
const activeConversationId = computed(() => activeConversation.value?.id ?? '');

const scrollMode = computed(() =>
  appStore.getConversationScrollMode(activeConversationId.value),
);
</script>

<template>
  <div class="chat-view-panel panel-glow">
    <!-- While the list is still booting or the active conversation is being
         hydrated, show a skeleton instead of the empty states so the chat
         never flashes "no conversation" before content arrives. -->
    <ExchangeSkeleton v-if="isExchangesLoading" />

    <!-- Key by conversation id: a chat switch remounts the list so no scroll
         state (scroll offsets, saved positions, blend opacity inputs) can
         leak from one conversation into the next. Without the key, a switch
         to a cached conversation patches props in place and the carousel
         keeps the old chat's scroll offset — leaving the visible slide at a
         stale blend opacity or landing on an arbitrary section. -->
    <ScrollableExchangeList
      v-else-if="isSessionActive"
      :key="activeConversationId"
      :sections="sections"
      :mode="scrollMode"
      :highlighted-ids="highlightedIds"
      :collapsed-ids="collapsedIds"
      :is-compact="isCompact"
      :active-assistant-exchange-id="activeAssistantExchangeId"
      :active-assistant-response-started="activeAssistantResponseStarted"
      @retry="retryExchange"
      @scroll="emit('scroll')"
    />

    <NoConversationPanel v-else />
  </div>
</template>

<style scoped>
.chat-view-panel {
  background-color: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
