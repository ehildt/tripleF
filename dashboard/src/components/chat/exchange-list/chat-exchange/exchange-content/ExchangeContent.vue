<script setup lang="ts">
import { computed } from 'vue';

import AssistantResponse from '@/components/chat/exchange-list/chat-exchange/exchange-content/assistant-response/AssistantResponse.vue';
import UserRequest from '@/components/chat/exchange-list/chat-exchange/exchange-content/user-request/UserRequest.vue';
import type { Exchange } from '@/stores/conversation';

import { buildMessageClasses } from '../helpers/build-message-classes.helper';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isError: boolean;
  isPending: boolean;
  isStreaming: boolean;
  isHighlighted: boolean;
  isCompacting: boolean;
}>();

const emit = defineEmits<{
  imageClicked: [images: string[], clickedSrc: string];
}>();

const messageClasses = computed(() =>
  buildMessageClasses({
    isUser: props.isUser,
    isError: props.isError,
    isHighlighted: props.isHighlighted,
  }),
);

const isAssistantResponse = computed(
  () =>
    !!props.exchange.harnessTemplate &&
    (props.exchange.harnessData !== undefined ||
      props.exchange.text !== undefined),
);

const isStreamingAssistant = computed(
  () => props.isStreaming && !!props.exchange.harnessTemplate,
);

const showStreamingSkeleton = computed(
  () => isStreamingAssistant.value && !props.exchange.harnessData,
);

const isUserRequest = computed(() => props.isUser);
</script>

<template>
  <div
    v-if="!isError && isUser"
    class="exchange-content-divider exchange-content-divider--user"
  />
  <div
    v-else-if="isError"
    class="exchange-content-divider exchange-content-divider--error"
  />
  <div
    v-else
    class="exchange-content-divider exchange-content-divider--assistant"
  />

  <div :class="messageClasses">
    <template v-if="isPending && !exchange.content">
      <span v-if="isCompacting" class="exchange-content__compacting">
        <span class="exchange-content__battery">
          <span class="exchange-content__battery-fill" />
        </span>
        <span class="exchange-content__compacting-text"
          >Compacting conversation…</span
        >
      </span>
      <span v-else class="exchange-content__dots">
        <span class="exchange-content__dot" />
        <span class="exchange-content__dot" style="animation-delay: 0.2s" />
        <span class="exchange-content__dot" style="animation-delay: 0.4s" />
      </span>
    </template>
    <div
      v-else-if="showStreamingSkeleton"
      class="exchange-content__body content-body"
    >
      <span class="exchange-content__dots">
        <span class="exchange-content__dot" />
        <span class="exchange-content__dot" style="animation-delay: 0.2s" />
        <span class="exchange-content__dot" style="animation-delay: 0.4s" />
      </span>
    </div>
    <div
      v-else-if="isAssistantResponse"
      class="exchange-content__body content-body"
    >
      <AssistantResponse
        :template="exchange.harnessTemplate ?? ''"
        :data="exchange.harnessData"
        :text="exchange.text"
        @image-clicked="(...args) => emit('imageClicked', ...args)"
      />
    </div>
    <div
      v-else-if="isUserRequest"
      :class="messageClasses"
      class="user-request-wrapper"
    >
      <UserRequest :content="exchange.content" />
    </div>
    <div
      v-else-if="isError"
      class="exchange-content__body content-body exchange-content__body--error"
    >
      {{ exchange.content }}
    </div>
    <div
      v-else
      class="exchange-content__body content-body exchange-content__body--plain"
    >
      {{ exchange.content }}
    </div>
    <span v-if="isStreaming" class="exchange-content__cursor" />
  </div>
</template>

<style scoped>
.exchange-content-divider {
  height: 1px;
  width: 100%;
  flex-shrink: 0;
}

.exchange-content-divider--user {
  background: linear-gradient(
    to left,
    color-mix(in srgb, var(--color-tab-rest) 40%, transparent),
    transparent
  );
}

.exchange-content-divider--error {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-status-error) 50%, transparent),
    transparent
  );
}

.exchange-content-divider--assistant {
  background: linear-gradient(
    to right,
    color-mix(in srgb, var(--color-tab-rest) 40%, transparent),
    transparent
  );
}

.exchange-content__compacting {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
  color: var(--color-fg-muted);
}

.exchange-content__battery {
  width: 4rem;
  height: 0.375rem;
  position: relative;
  overflow: hidden;
  background-color: var(--color-bg-tertiary);
  display: inline-block;
}

.exchange-content__battery-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 50%;
  background-color: var(--color-loading, var(--color-accent-primary));
  animation: battery-slide 1.5s ease-in-out infinite;
}

@keyframes battery-slide {
  0% {
    left: -50%;
  }
  100% {
    left: 100%;
  }
}

.exchange-content__compacting-text {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.exchange-content__dots {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--color-fg-muted);
}

.exchange-content__dot {
  width: 0.375rem;
  height: 0.375rem;
  background-color: var(--color-tab-rest);
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

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

.exchange-content__cursor {
  display: inline-block;
  width: 0.5rem;
  height: 1rem;
  background-color: var(--color-tab-rest);
  margin-left: 0.125rem;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  vertical-align: text-bottom;
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

.exchange-content__body :deep(ul:has(> li > img):not(.harness-gallery)),
.exchange-content__body :deep(ol:has(> li > img):not(.harness-gallery)) {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
  padding: 0;
  margin: 0;
  list-style: none;
}

.exchange-content__body :deep(li:has(img):not(.harness-gallery__item)) {
  display: flex;
  flex-wrap: wrap;
  list-style: none;
  border: 1px solid var(--color-divider);
  overflow: hidden;
  padding: 0;
}

.exchange-content__body
  :deep(li:has(img):not(.harness-gallery__item) > :not(img)) {
  width: 100%;
  padding: 0.25rem 0.375rem;
}

.exchange-content__body :deep(li:has(img):not(.harness-gallery__item) h5) {
  padding: 0.5rem;
  margin: 0;
}

.exchange-content__body :deep(li:has(img):not(.harness-gallery__item) p) {
  padding: 0.5rem;
  margin: 0;
  font-size: 0.85em;
}

.exchange-content__body :deep(li:has(img):not(.harness-gallery__item) img) {
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
  border-radius: 0;
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

.exchange-content__body :deep(img):not(.harness-gallery__thumb) {
  cursor: pointer;
  transition: box-shadow 0.3s ease;
}

.exchange-content__body :deep(img):not(.harness-gallery__thumb):hover {
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
  border-radius: 0.25rem;
}

@keyframes breathe {
  0%,
  100% {
    opacity: 1;
    box-shadow: 0 0 0 0
      color-mix(in srgb, var(--color-accent-primary) 10%, transparent);
  }
  50% {
    opacity: 0.92;
    box-shadow: 0 0 12px 2px
      color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
  }
}
</style>
