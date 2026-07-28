<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import ChatConversationHeader from '../conversation-header/ChatConversationHeader.vue';
import { useActiveConversation } from './composables/use-active-conversation';
import { useExchangeActions } from './composables/use-exchange-actions';
import { useExchangeScrollContainer } from './composables/use-exchange-scroll-container';
import { useExchangeVisualState } from './composables/use-exchange-visual-state';
import NoConversationPanel from './no-conversation-panel/NoConversationPanel.vue';
import ScrollableExchangeList from './scrollable-exchange-list/ScrollableExchangeList.vue';

const props = defineProps<{
  compact?: boolean;
  retryHandler: (text: string) => Promise<void>;
}>();

const emit = defineEmits<{
  deleteConversation: [id: string];
  toggleIncluded: [exchangeId: string];
}>();

const { activeConversation, exchanges, activeAssistantExchangeId } =
  useActiveConversation();

const { highlightedIds, collapsedIds, onHoverDeleteStart, onHoverDeleteEnd } =
  useExchangeVisualState(exchanges);

const isCompact = computed(() => props.compact ?? false);

const scrollContainerRef = ref<HTMLElement | null>(null);

function onSetScrollContainer(container: HTMLElement | null) {
  scrollContainerRef.value = container;
}

const { scrollToBottom, scrollToExchange, onScroll } =
  useExchangeScrollContainer(
    isCompact,
    activeAssistantExchangeId,
    scrollContainerRef,
  );

const { deleteExchange, retryExchange, branchExchange } = useExchangeActions(
  props.retryHandler,
);

onMounted(() => {
  scrollToBottom();
});

const isSessionActive = computed(() => activeConversation.value !== null);
const activeConversationId = computed(() => activeConversation.value?.id ?? '');

defineExpose({ scrollToExchange });
</script>

<template>
  <div class="chat-exchange-list panel-glow">
    <ChatConversationHeader
      v-if="activeConversation"
      :title="activeConversation.title"
      :conversation-id="activeConversationId"
      @delete="emit('deleteConversation', activeConversationId)"
    />

    <ScrollableExchangeList
      v-if="isSessionActive"
      :exchanges="exchanges"
      :highlighted-ids="highlightedIds"
      :collapsed-ids="collapsedIds"
      @scroll="onScroll"
      @set-scroll-container="onSetScrollContainer"
      @delete="deleteExchange"
      @retry="retryExchange"
      @branch="branchExchange"
      @toggle-included="emit('toggleIncluded', $event)"
      @hover-delete-start="onHoverDeleteStart"
      @hover-delete-end="onHoverDeleteEnd"
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
