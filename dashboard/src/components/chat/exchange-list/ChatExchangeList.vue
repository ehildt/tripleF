<script setup lang="ts">
import { computed, provide, ref } from 'vue';

import { useAppStore } from '@/stores/app';
import { mediaPriorityKey } from '@/types/harness-response-data.model';

import ChatConversationHeader from '../conversation-header/ChatConversationHeader.vue';
import { useActiveConversation } from './composables/use-active-conversation';
import { useExchangeActions } from './composables/use-exchange-actions';
import { useExchangeVisualState } from './composables/use-exchange-visual-state';
import { buildExchangeSections } from './helpers/build-exchange-sections.helper';
import NoConversationPanel from './no-conversation-panel/NoConversationPanel.vue';
import ScrollableExchangeList from './scrollable-exchange-list/ScrollableExchangeList.vue';
import type { ChatExchangeListProps } from './ChatExchangeList.types';

const props = defineProps<ChatExchangeListProps>();

const emit = defineEmits<{
  deleteConversation: [id: string];
  toggleIncluded: [exchangeId: string];
  scroll: [];
}>();

const {
  activeConversation,
  exchanges,
  activeAssistantExchangeId,
  activeAssistantResponseStarted,
} = useActiveConversation();

const { highlightedIds, collapsedIds, onHoverDeleteStart, onHoverDeleteEnd } =
  useExchangeVisualState(exchanges);

const isCompact = computed(() => props.compact ?? false);

const sections = computed(() => buildExchangeSections(exchanges.value));

const { deleteExchange, retryExchange, branchExchange } = useExchangeActions(
  props.retryHandler,
);

const appStore = useAppStore();

const scrollableListRef = ref<InstanceType<
  typeof ScrollableExchangeList
> | null>(null);

function scrollToExchange(exchangeId: string) {
  scrollableListRef.value?.scrollToExchange(exchangeId);
}

const activeUserExchangeId = computed(
  () => scrollableListRef.value?.activeUserExchangeId ?? null,
);

const isSessionActive = computed(() => activeConversation.value !== null);
const activeConversationId = computed(() => activeConversation.value?.id ?? '');

const scrollMode = computed(() =>
  appStore.getConversationScrollMode(activeConversationId.value),
);

// Expose the active conversation's media-priority preference to the deep
// assistant-response templates (image vs video gallery ordering) without
// threading a prop through every presentational layer.
const mediaPriority = computed(() =>
  appStore.getConversationMediaPriority(activeConversationId.value),
);
provide(mediaPriorityKey, mediaPriority);

defineExpose({ scrollToExchange, activeUserExchangeId });
</script>

<template>
  <div class="chat-exchange-list panel-glow">
    <ChatConversationHeader
      v-if="activeConversation"
      :title="activeConversation.title"
      :conversation-id="activeConversationId"
    />

    <ScrollableExchangeList
      v-if="isSessionActive"
      ref="scrollableListRef"
      :sections="sections"
      :mode="scrollMode"
      :highlighted-ids="highlightedIds"
      :collapsed-ids="collapsedIds"
      :is-compact="isCompact"
      :active-assistant-exchange-id="activeAssistantExchangeId"
      :active-assistant-response-started="activeAssistantResponseStarted"
      @delete="deleteExchange"
      @retry="retryExchange"
      @branch="branchExchange"
      @toggle-included="emit('toggleIncluded', $event)"
      @hover-delete-start="onHoverDeleteStart"
      @hover-delete-end="onHoverDeleteEnd"
      @scroll="emit('scroll')"
    />

    <NoConversationPanel v-else />
  </div>
</template>

<style scoped>
.chat-exchange-list {
  background-color: var(--color-bg-secondary);
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
}
</style>
