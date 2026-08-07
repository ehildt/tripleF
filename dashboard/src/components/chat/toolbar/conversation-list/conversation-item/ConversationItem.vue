<script setup lang="ts">
import { Clock, Radio, Save, Tag, X } from '@lucide/vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
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
      <div class="conversation-item__top">
        <span class="conversation-item__context">{{
          contextUsagePercent
        }}</span>
        <div class="conversation-item__icons">
          <Tooltip
            v-if="conversation.event"
            :text="conversation.event"
            :positions="['bottom', 'top']"
          >
            <Radio class="conversation-item__icon" />
          </Tooltip>
          <Tooltip
            v-if="conversation.roomId"
            :text="conversation.roomId"
            :positions="['bottom', 'top']"
          >
            <Tag class="conversation-item__icon" />
          </Tooltip>
          <Tooltip
            v-if="conversation.type === 'temporary'"
            :text="`expires ${expiresLabel}`"
            :positions="['bottom', 'top']"
          >
            <Clock class="conversation-item__icon" />
          </Tooltip>
          <Tooltip
            v-else
            :text="$t('common.persisted')"
            :positions="['bottom', 'top']"
          >
            <Save class="conversation-item__icon" />
          </Tooltip>
          <Tooltip :text="$t('common.delete')" :positions="['top', 'bottom']">
            <button
              class="conversation-item__delete"
              type="button"
              :aria-label="$t('common.delete')"
              @click.stop="$emit('delete')"
            >
              <X class="w-3 h-3" />
            </button>
          </Tooltip>
        </div>
      </div>
      <div class="conversation-item__title">
        {{ conversation.title || '(untitled)' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-item {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-1);
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

.conversation-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-1-5);
  width: 100%;
}

.conversation-item__context {
  font-size: 10px;
  color: var(--color-fg-muted);
  flex-shrink: 0;
}

.conversation-item__icons {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
}

.conversation-item__icon {
  width: 0.75rem;
  height: 0.75rem;
  flex-shrink: 0;
}

.conversation-item__delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 0.75rem;
  height: 0.75rem;
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

.conversation-item__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
