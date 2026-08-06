<script setup lang="ts">
import type { Exchange } from '@/stores/conversation';

import AssistantResponse from './assistant-response/AssistantResponse.vue';
import { useExchangeRenderMode } from './composables/use-exchange-render-mode';
import { usePromptImageTiles } from './composables/use-prompt-image-tiles';
import ExchangeActivity from './exchange-activity/ExchangeActivity.vue';
import ExchangeDivider from './exchange-divider/ExchangeDivider.vue';
import StreamingCursor from './streaming-cursor/StreamingCursor.vue';
import StreamingSkeleton from './streaming-skeleton/StreamingSkeleton.vue';
import UserRequest from './user-request/UserRequest.vue';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isHighlighted: boolean;
}>();

interface LightboxImage {
  url: string;
  title?: string;
}

const emit = defineEmits<{
  (e: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
}>();

const { dividerVariant, renderMode, containerClasses, showStreamingCursor } =
  useExchangeRenderMode(
    () => props.exchange,
    () => ({
      isUser: props.isUser,
      isError: props.isError,
      isPending: props.isPending,
      isStreaming: props.isStreaming,
      isHighlighted: props.isHighlighted,
    }),
  );

const { imageTiles } = usePromptImageTiles(() => props.exchange);
</script>

<template>
  <ExchangeDivider :variant="dividerVariant" />

  <!-- pending-empty renders nothing: the assistant exchange exists but no
       reasoning or response data has arrived yet, so the padded container
       would paint as an empty box. -->
  <div
    v-if="renderMode !== 'pending-empty'"
    :class="[
      containerClasses,
      { 'exchange-message--plain': renderMode === 'plain' },
    ]"
  >
    <ExchangeActivity
      v-if="renderMode === 'reasoning'"
      :reasoning="exchange.reasoning"
    />
    <StreamingSkeleton v-else-if="renderMode === 'streaming-skeleton'" />
    <AssistantResponse
      v-else-if="renderMode === 'assistant-response'"
      :template="exchange.harnessTemplate ?? ''"
      :data="exchange.harnessData"
      :text="exchange.text"
      @image-clicked="(...args) => emit('imageClicked', ...args)"
    />
    <div v-else-if="renderMode === 'user-request'" class="user-request-wrapper">
      <UserRequest
        :content="exchange.content"
        :images="imageTiles"
        @image-clicked="(...args) => emit('imageClicked', ...args)"
      />
    </div>
    <template v-else-if="renderMode === 'error' || renderMode === 'plain'">{{
      exchange.content
    }}</template>

    <StreamingCursor v-if="showStreamingCursor" />
  </div>
</template>
