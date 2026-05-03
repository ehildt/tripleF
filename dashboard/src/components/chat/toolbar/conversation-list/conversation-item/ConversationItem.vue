<script setup lang="ts">
import { Clock, MessageSquareText, Radio, Save, Tag, X } from '@lucide/vue';

import type { Conversation } from '@/stores/conversation';

defineProps<{
  conversation: Conversation;
  isActive: boolean;
  contextUsagePercent: string;
  expiresLabel?: string;
}>();

defineEmits<{
  select: [];
  delete: [];
}>();
</script>

<template>
  <div
    class="conversation-item"
    :class="{ 'conversation-item--inactive': !isActive }"
    role="button"
    tabindex="0"
    @click="$emit('select')"
    @keydown.enter.prevent="$emit('select')"
    @keydown.space.prevent="$emit('select')"
  >
    <div class="conversation-item__content">
      <div class="conversation-item__header">
        <MessageSquareText
          class="conversation-item__type-icon"
          :title="
            conversation.type === 'temporary' ? 'Temporary' : 'Persistent'
          "
        />
        <span class="conversation-item__title">{{
          conversation.title || '(untitled)'
        }}</span>
        <span class="conversation-item__context">{{
          contextUsagePercent
        }}</span>
        <button
          class="conversation-item__delete"
          type="button"
          title="Delete"
          @click.stop="$emit('delete')"
        >
          <X class="w-3 h-3" />
        </button>
      </div>
      <div v-if="conversation.event" class="conversation-item__meta">
        <Radio class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ conversation.event }}</span>
      </div>
      <div v-if="conversation.roomId" class="conversation-item__meta">
        <Tag class="w-3 h-3 shrink-0" />
        <span class="truncate">{{ conversation.roomId }}</span>
      </div>
      <div
        v-if="conversation.type === 'temporary'"
        class="conversation-item__meta"
      >
        <Clock class="w-3 h-3 shrink-0" />
        expires {{ expiresLabel }}
      </div>
      <div v-else class="conversation-item__meta">
        <Save class="w-3 h-3 shrink-0" />
        persisted
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-2);
  text-align: left;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  width: 100%;
  box-sizing: border-box;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease,
    outline 0.2s ease;
}

.conversation-item:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: -1px;
}

.conversation-item--inactive {
  opacity: 0.7;
}

.conversation-item:hover {
  background-color: color-mix(
    in srgb,
    var(--color-bg-tertiary) 80%,
    transparent
  );
}

.conversation-item__content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.conversation-item__header {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  width: 100%;
}

.conversation-item__type-icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
  color: var(--color-accent-primary);
}

.conversation-item__title {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.conversation-item__context {
  font-size: 10px;
  color: var(--color-fg-muted);
  flex-shrink: 0;
}

.conversation-item__delete {
  padding: 0.125rem;
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: transparent;
}

.conversation-item__delete:hover {
  color: var(--color-accent-primary);
}

.conversation-item__meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  font-size: 10px;
  color: var(--color-fg-muted);
}
</style>
