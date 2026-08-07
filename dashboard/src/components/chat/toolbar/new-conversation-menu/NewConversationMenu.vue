<script setup lang="ts">
import { CircleGauge, Hash, MessagesSquare, Radio } from '@lucide/vue';
import { computed, ref } from 'vue';

import ComboBox from '../../../shared/ui/combo-box/ComboBox.vue';
import Dropdown from '../../../shared/ui/drop-down/DropDown.vue';
import MotionIcon from '../../../shared/ui/motion-icon/MotionIcon.vue';
import { useMenuPosition } from '../model-selector/composables/use-menu-position';
import IconButton from '../shared/ui/icon-button/IconButton.vue';
import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';

defineEmits<{
  toggleMenu: [];
  'update:newConversationName': [value: string];
  'update:newConversationEvent': [value: string];
  'update:newConversationRoomId': [value: string];
  createConversation: [type: 'temporary' | 'persistent'];
  selectNumCtx: [ctx: string];
}>();

const props = defineProps<{
  isOpen: boolean;
  isDisabled: boolean;
  newConversationName: string;
  newConversationEvent: string;
  newConversationRoomId: string;
  availableSocketEvents: readonly string[];
  availableRooms: readonly string[];
  filteredNumCtxOptions: readonly string[];
  currentNumCtx: string;
  defaultNumCtx: string;
  formatCtx: (n: number) => string;
  blinking?: { value: boolean };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>();

// Like the model-select menu: teleport the dropdown to <body> with a fixed
// position — rendered inline (z-150) it sits inside the sticky toolbar's
// stacking context (z-50), so the chat column and video popouts cover it.
const triggerRef = ref<HTMLElement | null>(null);
const isOpenRef = computed(() => props.isOpen);
const { positionStyle } = useMenuPosition(triggerRef, isOpenRef);
</script>

<template>
  <div class="flex items-center gap-1.5 w-full justify-end">
    <ToolbarLabel value="conversations" translate />
    <div ref="triggerRef" class="relative shrink-0">
      <IconButton
        :active="isOpen"
        :disabled="isDisabled"
        :blinking="blinking"
        :on-mouse-enter="onMouseEnter"
        :on-mouse-leave="onMouseLeave"
        :title="$t('common.sessions')"
        @click.stop="$emit('toggleMenu')"
      >
        <MotionIcon><MessagesSquare class="w-4 h-4" /></MotionIcon>
      </IconButton>
      <Teleport to="body">
        <div
          v-if="isOpen"
          class="new-conversation-menu__dropdown"
          data-toolbar-menu-dropdown
          :style="positionStyle ?? undefined"
          @click.stop
        >
          <div class="new-conversation-menu__content">
            <div class="new-conversation-menu__input-wrapper">
              <MessagesSquare class="new-conversation-menu__input-icon" />
              <input
                :value="newConversationName"
                name="conversation-name"
                :placeholder="$t('common.conversationName')"
                class="new-conversation-menu__input"
                @input="
                  $emit(
                    'update:newConversationName',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>
            <Dropdown
              :label="$t('common.context')"
              menu-style="centered"
              :options="filteredNumCtxOptions"
              :model-value="currentNumCtx || defaultNumCtx"
              :format-value="(v: string) => formatCtx(Number(v))"
              @update:model-value="$emit('selectNumCtx', $event)"
            >
              <CircleGauge class="w-3.5 h-3.5" />
            </Dropdown>
            <ComboBox
              :model-value="newConversationEvent"
              :options="availableSocketEvents"
              placeholder="socket"
              @update:model-value="$emit('update:newConversationEvent', $event)"
            >
              <Radio class="w-3.5 h-3.5" />
            </ComboBox>
            <ComboBox
              :model-value="newConversationRoomId"
              :options="availableRooms"
              placeholder="channel"
              @update:model-value="
                $emit('update:newConversationRoomId', $event)
              "
            >
              <Hash class="w-3.5 h-3.5" />
            </ComboBox>
            <div class="new-conversation-menu__button-row">
              <button
                class="new-conversation-menu__button"
                :class="
                  newConversationName.trim()
                    ? 'new-conversation-menu__button--enabled'
                    : 'new-conversation-menu__button--disabled'
                "
                :disabled="!newConversationName.trim()"
                @click.stop="$emit('createConversation', 'temporary')"
              >
                Temporary
              </button>
              <button
                class="new-conversation-menu__button"
                :class="
                  newConversationName.trim()
                    ? 'new-conversation-menu__button--enabled'
                    : 'new-conversation-menu__button--disabled'
                "
                :disabled="!newConversationName.trim()"
                @click.stop="$emit('createConversation', 'persistent')"
              >
                Persistent
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.new-conversation-menu__dropdown {
  /* Teleported to <body>: above the chat column (z-60) and the floating
     video popouts (z-1000), below the lightbox (1100) — same layer as the
     model-select menu. Position comes from the trigger anchor inline style. */
  position: fixed;
  z-index: 1050;
  margin-left: var(--spacing-1);
  width: 14rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}

.new-conversation-menu__dropdown :deep(.relative button) {
  font-size: 0.75rem;
}

.new-conversation-menu__dropdown :deep(.relative button span) {
  font-size: 0.75rem;
}

.new-conversation-menu__dropdown :deep(.relative li) {
  font-size: 0.75rem;
}

.new-conversation-menu__content {
  padding: var(--spacing-1);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.new-conversation-menu__input-wrapper {
  position: relative;
}

.new-conversation-menu__input-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
  position: absolute;
  left: var(--spacing-3);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.new-conversation-menu__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  padding-left: 2rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
}

.new-conversation-menu__input::placeholder {
  color: var(--color-fg-muted);
}

.new-conversation-menu__input:focus {
  border-color: var(--color-accent-primary);
}

.new-conversation-menu__button-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.new-conversation-menu__button {
  flex: 1;
  padding: var(--spacing-1-5) var(--spacing-2);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  transition:
    color 0.3s ease,
    background-color 0.3s ease,
    border-color 0.3s ease;
  border: 1px solid var(--color-divider);
}

.new-conversation-menu__button--enabled {
  cursor: pointer;
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
}

.new-conversation-menu__button--enabled:hover {
  background-color: var(--color-accent-primary);
  color: var(--color-fg-inverse);
}

.new-conversation-menu__button--disabled {
  cursor: default;
  opacity: 0.5;
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
}
</style>
