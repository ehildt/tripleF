<script setup lang="ts">
import { Clock, Pin, Radio, Tag, Trash2 } from '@lucide/vue';
import { ref } from 'vue';

import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import type { Conversation } from '@/stores/conversation';

defineProps<{
  conversation: Conversation;
  isActive: boolean;
  contextUsagePercent: string | null;
  expiresLabel?: string;
}>();

const emit = defineEmits<{
  select: [];
  delete: [];
  toggleType: [];
}>();

/** Which action button is mid "pop" animation ('pin' | 'delete' | null). */
const pressedAction = ref<'pin' | 'delete' | null>(null);

function press(action: 'pin' | 'delete') {
  pressedAction.value = action;
  window.setTimeout(() => {
    if (pressedAction.value === action) pressedAction.value = null;
  }, 300);
}
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
      <div class="conversation-item__title">
        {{ conversation.title || '(untitled)' }}
      </div>
      <div class="conversation-item__top">
        <span
          v-if="contextUsagePercent != null"
          class="conversation-item__context"
          >{{ contextUsagePercent }}</span
        >
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
            :text="
              conversation.type === 'temporary'
                ? $t('common.pinToPersistent')
                : $t('common.unpinToTemporary')
            "
            :positions="['bottom', 'top']"
          >
            <template #content>
              <div class="conversation-item__pin-tooltip">
                <span>
                  {{
                    conversation.type === 'temporary'
                      ? $t('common.pinToPersistent')
                      : $t('common.unpinToTemporary')
                  }}
                </span>
                <span
                  v-if="conversation.type === 'temporary' && expiresLabel"
                  class="conversation-item__pin-tooltip-expiry"
                >
                  {{ $t('common.expiresIn', { time: expiresLabel }) }}
                </span>
              </div>
            </template>
            <button
              type="button"
              class="conversation-item__action"
              :class="{
                'conversation-item__action--pinned':
                  conversation.type === 'persistent',
                'conversation-item__action--pressed': pressedAction === 'pin',
              }"
              :aria-label="
                conversation.type === 'temporary'
                  ? $t('common.pinToPersistent')
                  : $t('common.unpinToTemporary')
              "
              @click.stop="
                press('pin');
                emit('toggleType');
              "
            >
              <Clock
                v-if="conversation.type === 'temporary'"
                class="conversation-item__action-icon"
              />
              <Pin v-else class="conversation-item__action-icon" />
            </button>
          </Tooltip>

          <Tooltip :text="$t('common.delete')" :positions="['top', 'bottom']">
            <button
              class="conversation-item__action conversation-item__action--danger"
              :class="{
                'conversation-item__action--pressed':
                  pressedAction === 'delete',
              }"
              type="button"
              :aria-label="$t('common.delete')"
              @click.stop="
                press('delete');
                emit('delete');
              "
            >
              <Trash2 class="conversation-item__action-icon" />
            </button>
          </Tooltip>
        </div>
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
  flex-direction: row;
  align-items: center;
  gap: var(--spacing-1-5);
}

.conversation-item__top {
  display: flex;
  align-items: center;
  gap: var(--spacing-1-5);
  flex-shrink: 0;
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
  color: var(--color-fg-muted);
}

/* Pin + delete buttons — match the history-item action styling (accent hover,
   danger for delete, and a click "pop"). */
.conversation-item__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-0-5);
  color: var(--color-fg-muted);
  transition: color 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
  border: none;
  background: transparent;
}

.conversation-item__action:hover {
  color: var(--color-accent-primary);
}

.conversation-item__action--pinned {
  color: var(--color-accent-primary);
}

.conversation-item__action--danger:hover {
  color: var(--color-status-error);
}

.conversation-item__action--pressed .conversation-item__action-icon {
  animation: conversation-item-pop 0.3s ease;
}

.conversation-item__action-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.conversation-item__pin-tooltip {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.conversation-item__pin-tooltip-expiry {
  color: var(--color-fg-muted);
}

@keyframes conversation-item-pop {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.conversation-item__title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
