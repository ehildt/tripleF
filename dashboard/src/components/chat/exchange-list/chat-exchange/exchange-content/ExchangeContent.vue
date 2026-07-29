<script setup lang="ts">
import AssistantResponse from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/AssistantResponse.vue';
import UserRequest from '@/components/chat/exchange-list/chat-exchange/exchange-content/user-request/UserRequest.vue';
import type { Exchange } from '@/stores/conversation';

import CompactingIndicator from './compacting-indicator/CompactingIndicator.vue';
import { useExchangeRenderMode } from './composables/use-exchange-render-mode';
import { usePromptImageTiles } from './composables/use-prompt-image-tiles';
import ExchangeActivity from './exchange-activity/ExchangeActivity.vue';
import ExchangeDivider from './exchange-divider/ExchangeDivider.vue';
import StreamingCursor from './streaming-cursor/StreamingCursor.vue';
import StreamingSkeleton from './streaming-skeleton/StreamingSkeleton.vue';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isHighlighted: boolean;
  isCompacting: boolean;
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
      isCompacting: props.isCompacting,
    }),
  );

const { imageTiles } = usePromptImageTiles(() => props.exchange);
</script>

<template>
  <ExchangeDivider :variant="dividerVariant" />

  <!-- pending-empty renders nothing: the assistant exchange exists but no
       reasoning or response data has arrived yet, so the padded container
       would paint as an empty box. -->
  <div v-if="renderMode !== 'pending-empty'" :class="containerClasses">
    <CompactingIndicator v-if="renderMode === 'compacting'" />
    <ExchangeActivity
      v-else-if="renderMode === 'reasoning'"
      :reasoning="exchange.reasoning"
    />
    <div
      v-else-if="renderMode === 'streaming-skeleton'"
      class="exchange-content__body content-body"
    >
      <StreamingSkeleton />
    </div>
    <div
      v-else-if="renderMode === 'assistant-response'"
      class="exchange-content__body content-body"
    >
      <AssistantResponse
        :template="exchange.harnessTemplate ?? ''"
        :data="exchange.harnessData"
        :text="exchange.text"
        @image-clicked="(...args) => emit('imageClicked', ...args)"
      />
    </div>
    <div v-else-if="renderMode === 'user-request'" class="user-request-wrapper">
      <UserRequest
        :content="exchange.content"
        :images="imageTiles"
        @image-clicked="(...args) => emit('imageClicked', ...args)"
      />
    </div>
    <div
      v-else-if="renderMode === 'error'"
      class="exchange-content__body content-body exchange-content__body--error"
    >
      {{ exchange.content }}
    </div>
    <div
      v-else-if="renderMode === 'plain'"
      class="exchange-content__body content-body exchange-content__body--plain"
    >
      {{ exchange.content }}
    </div>
    <StreamingCursor v-if="showStreamingCursor" />
  </div>
</template>

<style scoped>
.exchange-content__body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.exchange-content__body :deep(> *) {
  flex: 1 1 100%;
  margin-top: 0;
  margin-bottom: 0;
  min-width: 0;
  max-width: 100%;
}

.exchange-content__body :deep(h1) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 14%, transparent);
}

.exchange-content__body :deep(h2) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 12%, transparent);
}

.exchange-content__body :deep(h3) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
}

.exchange-content__body :deep(h4) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 8%, transparent);
}

.exchange-content__body :deep(h5) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 6%, transparent);
}

.exchange-content__body :deep(h6) {
  padding: 0.2em 0.5em;
  background: color-mix(in srgb, var(--color-accent-primary) 4%, transparent);
}

.exchange-content__body :deep(div),
.exchange-content__body :deep(ul),
.exchange-content__body :deep(ol),
.exchange-content__body :deep(pre),
.exchange-content__body :deep(table),
.exchange-content__body :deep(blockquote) {
  padding: var(--spacing-2);
}

.exchange-content__body :deep(h1 + *),
.exchange-content__body :deep(h2 + *),
.exchange-content__body :deep(h3 + *),
.exchange-content__body :deep(h4 + *),
.exchange-content__body :deep(h5 + *),
.exchange-content__body :deep(h6 + *) {
  padding: var(--spacing-2);
}

.exchange-content__body :deep(ul),
.exchange-content__body :deep(ol) {
  padding: var(--spacing-2);
}

/* Markdown image galleries only — structured video surfaces (videolist,
   video gallery) carry poster <img> elements too and must stay excluded. */
.exchange-content__body
  :deep(ul:has(> li > img):not(.harness-gallery):not(.video-gallery)),
.exchange-content__body
  :deep(ol:has(> li > img):not(.harness-gallery):not(.video-list__playlist)) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.exchange-content__body
  :deep(
    li:has(img):not(.harness-gallery__item):not(.image-item):not(
        .video-item
      ):not(.video-gallery__item)
  ) {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  padding: 0;
}

.exchange-content__body
  :deep(
    li:has(img):not(.harness-gallery__item):not(.image-item):not(
        .video-item
      ):not(.video-gallery__item)
      > :not(img)
  ) {
  width: 100%;
  padding: 0.25rem 0.375rem;
}

.exchange-content__body
  :deep(
    li:has(img):not(.harness-gallery__item):not(.image-item):not(
        .video-item
      ):not(.video-gallery__item)
      h5
  ) {
  padding: 0.5rem;
  margin: 0;
}

.exchange-content__body
  :deep(
    li:has(img):not(.harness-gallery__item):not(.image-item):not(
        .video-item
      ):not(.video-gallery__item)
      p
  ) {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85em;
}

.exchange-content__body
  :deep(
    li:has(img):not(.harness-gallery__item):not(.image-item):not(
        .video-item
      ):not(.video-gallery__item)
      img
  ) {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  cursor: pointer;
  max-width: none;
  padding: 0;
  border: none;
  display: block;
}

.exchange-content__body :deep(div:has(> img)) {
  display: flex;
  flex-wrap: wrap;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  padding: 0;
}

.exchange-content__body :deep(div:has(> img) > :not(img)) {
  width: 100%;
  padding: 0.25rem 0.375rem;
}

.exchange-content__body :deep(div:has(> img) h5) {
  padding: 0.5rem;
  margin: 0;
}

.exchange-content__body :deep(div:has(> img) p) {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85em;
}

.exchange-content__body :deep(div:has(> img) img) {
  width: 100%;
  height: 12rem;
  object-fit: cover;
  cursor: pointer;
  max-width: none;
  padding: 0;
  border: none;
  display: block;
}

.exchange-content__body :deep(> div:has(> img)) {
  flex: 1 1 calc(33.333% - 0.5rem);
  min-width: 30%;
}

.exchange-content__body :deep(a) {
  transition: color 0.2s ease;
}

.exchange-content__body :deep(blockquote) {
  border-left-color: var(--color-accent-primary);
  background: color-mix(in srgb, var(--color-accent-primary) 4%, transparent);
}

.exchange-content__body :deep(pre) {
  border-left: 3px solid
    color-mix(in srgb, var(--color-accent-primary) 40%, transparent);
}

.exchange-content__body
  :deep(img):not(.harness-gallery__thumb):not(.image-item__img):not(
    .floating-video-figure__poster-image
  ) {
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.exchange-content__body
  :deep(img):not(.harness-gallery__thumb):not(.image-item__img):not(
    .floating-video-figure__poster-image
  ):hover {
  animation: img-pulse 2s ease-in-out infinite;
}

@keyframes img-pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0
      color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  }
  50% {
    box-shadow: 0 0 0 4px
      color-mix(in srgb, var(--color-accent-primary) 30%, transparent);
  }
}

.exchange-content__body :deep(tbody tr:hover) {
  background: color-mix(in srgb, var(--color-fg-primary) 4%, transparent);
}

.exchange-content__body :deep(hr) {
  border: none;
  height: 2px;
  background: var(--color-bg-secondary);
}

.exchange-content__body :deep(video) {
  max-width: 100%;
  height: auto;
  display: block;
  border: 1px solid var(--color-divider);
}

.exchange-content__body :deep(iframe) {
  max-width: 100%;
  display: block;
  border: 1px solid var(--color-divider);
}

.exchange-content__body--plain {
  white-space: pre-line;
}

.user-request-wrapper {
  display: flex;
  justify-content: flex-end;
  width: 100%;
}

.exchange-content__message--highlighted {
  animation: breathe 2s ease-in-out infinite;
}

/* NOTE: no filter/transform/opacity here — filter and transform make this
   container the containing block for position:fixed descendants, and
   opacity < 1 creates a stacking context that caps the floating video
   popup's z-index. A box-shadow pulse avoids both. */
@keyframes breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 0 3px
      color-mix(in srgb, var(--color-accent-primary) 35%, transparent);
  }
}
</style>
