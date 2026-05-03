<script setup lang="ts">
import {
  Bot,
  BrainCog,
  Copy,
  Flame,
  GitBranch,
  HandMetal,
  LayoutTemplate,
  Lightbulb,
  RefreshCw,
  Search,
  SendToBack,
  Trash2,
  User,
  X,
} from '@lucide/vue';
import { computed } from 'vue';

import type { Exchange } from '@/stores/conversation';

import { formatExchangeTime } from '../helpers/format-exchange-time.helper';

const props = defineProps<{
  exchange: Exchange;
  isUser: boolean;
  isDone: boolean;
  isError: boolean;
  isPending: boolean;
}>();

const emit = defineEmits<{
  copy: [];
  retry: [];
  branch: [];
  delete: [];
  toggleIncluded: [];
  cancel: [requestId: string];
  hoverDeleteStart: [];
  hoverDeleteEnd: [];
}>();

const assistantIcon = computed(() => {
  switch (props.exchange.phase) {
    case 'classifying':
      return Lightbulb;
    case 'strategizing':
      return BrainCog;
    case 'summarizing':
      return Search;
    case 'rendering':
      return LayoutTemplate;
    case 'reviewing':
      return Flame;
    default:
      return HandMetal;
  }
});

const time = computed(() => formatExchangeTime(props.exchange.timestamp));

function onCopy() {
  emit('copy');
}

function onRetry() {
  emit('retry');
}

function onBranch() {
  emit('branch');
}

function onDelete() {
  emit('delete');
}

function onToggleIncluded() {
  emit('toggleIncluded');
}

function onCancel() {
  if (props.exchange.requestId) {
    emit('cancel', props.exchange.requestId);
  }
}
</script>

<template>
  <div class="exchange-header" :class="isUser ? 'exchange-header--user' : ''">
    <div v-if="!isUser" class="exchange-header__role">
      <Bot class="exchange-header__bot-icon" />
      <component
        :is="assistantIcon"
        v-if="exchange.phase"
        class="exchange-header__phase-icon"
      />
      <HandMetal v-else class="exchange-header__phase-icon-muted" />
    </div>
    <User v-if="isUser" class="exchange-header__user-icon" />

    <button
      v-if="isDone"
      class="exchange-header__action"
      title="Copy"
      @click="onCopy"
    >
      <Copy class="exchange-header__action-icon" />
    </button>
    <button
      v-if="isError"
      class="exchange-header__action exchange-header__action--error"
      title="Retry"
      @click="onRetry"
    >
      <RefreshCw class="exchange-header__action-icon" />
    </button>
    <button
      v-if="isUser"
      class="exchange-header__action"
      title="Toggle context inclusion"
      @click="onToggleIncluded"
    >
      <SendToBack
        class="exchange-header__action-icon"
        :class="
          exchange.included === false
            ? 'exchange-header__action-icon--excluded'
            : ''
        "
      />
    </button>
    <button
      v-if="isUser"
      class="exchange-header__action"
      title="Branch"
      @click="onBranch"
    >
      <GitBranch class="exchange-header__action-icon" />
    </button>
    <button
      v-if="isUser"
      class="exchange-header__action exchange-header__action--danger"
      title="Delete"
      @click="onDelete"
      @mouseenter="emit('hoverDeleteStart')"
      @mouseleave="emit('hoverDeleteEnd')"
    >
      <Trash2 class="exchange-header__action-icon" />
    </button>
    <button
      v-if="isPending && exchange.requestId"
      class="exchange-header__action"
      title="Cancel"
      @click="onCancel"
    >
      <X class="exchange-header__action-icon" />
    </button>

    <span class="exchange-header__time">{{ time }}</span>
    <span v-if="exchange.model" class="exchange-header__meta">{{
      exchange.model
    }}</span>
    <span v-if="exchange.requestId" class="exchange-header__meta">{{
      exchange.requestId
    }}</span>
  </div>
</template>

<style scoped>
.exchange-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-1);
}

.exchange-header--user {
  flex-direction: row-reverse;
}

.exchange-header__role {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
}

.exchange-header__bot-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-tab-rest);
}

.exchange-header__phase-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-accent-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.exchange-header__phase-icon-muted {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
}

.exchange-header__user-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
  color: var(--color-tab-accent);
}

.exchange-header__action {
  padding: var(--spacing-0-5);
  color: var(--color-fg-muted);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s ease;
}

.exchange-header__action:hover {
  color: var(--color-accent-primary);
}

.exchange-header__action--error {
  color: var(--color-status-error);
}

.exchange-header__action--error:hover {
  color: var(--color-accent-primary);
}

.exchange-header__action--danger:hover {
  color: var(--color-status-error);
}

.exchange-header__action-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.exchange-header__action-icon--excluded {
  transform: rotate(180deg);
  color: var(--color-accent-primary);
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.exchange-header__time {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}

.exchange-header__meta {
  font-size: 0.75rem;
  color: var(--color-fg-muted);
  font-family: var(--font-mono);
}
</style>
