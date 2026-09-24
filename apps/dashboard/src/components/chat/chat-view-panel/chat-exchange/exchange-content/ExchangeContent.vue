<script setup lang="ts">
import type { Exchange } from '@/stores/conversation';
import type { LightboxImage } from '@/types/lightbox.model';

import AssistantResponse from './assistant-response/AssistantResponse.vue';
import { useExchangeRenderMode } from './composables/use-exchange-render-mode';
import { usePromptDocumentTiles } from './composables/use-prompt-document-tiles';
import { usePromptImageTiles } from './composables/use-prompt-image-tiles';
import ExchangeActivity from './exchange-activity/ExchangeActivity.vue';
import ExchangeDivider from './exchange-divider/ExchangeDivider.vue';
import UserRequest from './user-request/UserRequest.vue';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isHighlighted: boolean;
}>();

const emit = defineEmits<{
  (e: 'imageClicked', images: LightboxImage[], clickedUrl: string): void;
  (e: 'documentClicked', document: { name: string; url: string }): void;
}>();

const { dividerVariant, renderMode, containerClasses } = useExchangeRenderMode(
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
const { documentTiles } = usePromptDocumentTiles(() => props.exchange);
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
    <AssistantResponse
      v-else-if="renderMode === 'assistant-response'"
      :template="exchange.harnessTemplate ?? ''"
      :data="exchange.harnessData"
      :text="exchange.text"
      :chart-data="exchange.chartData"
      :reveal-charts="exchange.revealCharts"
      @image-clicked="(...args) => emit('imageClicked', ...args)"
    />
    <div v-else-if="renderMode === 'user-request'" class="user-request-wrapper">
      <UserRequest
        :content="exchange.content"
        :images="imageTiles"
        :documents="documentTiles"
        @image-clicked="(...args) => emit('imageClicked', ...args)"
        @document-clicked="(...args) => emit('documentClicked', ...args)"
      />
    </div>
    <template v-else-if="renderMode === 'error' || renderMode === 'plain'">{{
      exchange.content
    }}</template>
  </div>
</template>

<style scoped>
/* Message container styles. The container div lives in this component's
   template, so the base and modifier classes bind directly. Markdown
   typography (headings, galleries, code, tables) lives in the components
   that render markdown (TextResponse, ExchangeActivity) instead. */

.exchange-message {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
  font-size: 0.875rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-secondary);
  text-align: left;
}

.exchange-message--user {
  background-color: color-mix(
    in srgb,
    var(--color-accent-primary) 10%,
    transparent
  );
  text-align: right;
}

.exchange-message--error {
  background-color: color-mix(
    in srgb,
    var(--color-status-error) 5%,
    transparent
  );
  color: var(--color-status-error);
}

/* Direct children of the message container (component roots and plain
   wrappers) stretch full-width; :deep needed because most are child
   component roots. */
.exchange-message :deep(> *) {
  flex: 1 1 100%;
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  max-width: 100%;
}

.exchange-message--plain {
  white-space: pre-line;
}

.exchange-message--highlighted {
  animation: exchange-message-breathe 2s ease-in-out infinite;
}

/* NOTE: no filter/transform/opacity here — filter and transform make this
   container the containing block for position:fixed descendants, and
   opacity < 1 creates a stacking context that caps the floating video
   popup's z-index. A box-shadow pulse avoids both. */
@keyframes exchange-message-breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--color-accent-primary) 35%, transparent);
  }
}

/* User prompts style their own text bubble inside UserRequest; the
   container is an unboxed right-aligned row (image tiles above the bubble
   must not sit inside the colored box). */
.exchange-user-wrap {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  font-size: 0.875rem;
  font-family: var(--font-mono);
}

.user-request-wrapper {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}
</style>
