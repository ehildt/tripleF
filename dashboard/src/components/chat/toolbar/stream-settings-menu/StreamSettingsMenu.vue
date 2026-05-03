<script setup lang="ts">
import { Network, Radio, RadioTower, Tag } from '@lucide/vue';

import IconButton from '../shared/ui/icon-button/IconButton.vue';
import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';

defineProps<{
  isOpen: boolean;
  isDisabled: boolean;
  isStreamEnabled: boolean;
  newEvent: string;
  newRoomId: string;
  blinking?: { value: boolean };
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}>();

defineEmits<{
  toggleMenu: [];
  'update:isStreamEnabled': [value: boolean];
  'update:newEvent': [value: string];
  'update:newRoomId': [value: string];
  subscribeToEvent: [];
}>();
</script>

<template>
  <div class="flex items-center gap-1.5 w-full justify-end">
    <ToolbarLabel value="sockets" />
    <div class="relative shrink-0">
      <IconButton
        :active="isOpen"
        :disabled="isDisabled"
        :blinking="blinking"
        :on-mouse-enter="onMouseEnter"
        :on-mouse-leave="onMouseLeave"
        title="Stream settings"
        @click.stop="$emit('toggleMenu')"
      >
        <Network class="w-4 h-4" />
      </IconButton>
      <div v-if="isOpen" class="stream-settings-menu__dropdown" @click.stop>
        <div class="stream-settings-menu__content">
          <div class="stream-settings-menu__row">
            <span class="stream-settings-menu__icon-container">
              <RadioTower class="stream-settings-menu__icon" />
            </span>
            <span class="stream-settings-menu__label">Stream</span>
            <div class="stream-settings-menu__toggle-group">
              <button
                class="stream-settings-menu__toggle"
                :class="
                  isStreamEnabled
                    ? 'stream-settings-menu__toggle--active'
                    : 'stream-settings-menu__toggle--inactive'
                "
                @click.stop="$emit('update:isStreamEnabled', true)"
              >
                Word
              </button>
              <button
                class="stream-settings-menu__toggle"
                :class="
                  !isStreamEnabled
                    ? 'stream-settings-menu__toggle--active'
                    : 'stream-settings-menu__toggle--inactive'
                "
                @click.stop="$emit('update:isStreamEnabled', false)"
              >
                Text
              </button>
            </div>
          </div>
          <div class="stream-settings-menu__description">
            <template v-if="isStreamEnabled"
              >Streams tokens as they arrive for real-time output.</template
            >
            <template v-else>Renders once the full response arrives.</template>
          </div>
          <div class="stream-settings-menu__divider"></div>
          <div class="stream-settings-menu__input-row">
            <div class="stream-settings-menu__input-wrapper">
              <Radio class="stream-settings-menu__input-icon" />
              <input
                :value="newEvent"
                placeholder="Socket"
                class="stream-settings-menu__input"
                @input="
                  $emit(
                    'update:newEvent',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>
            <div class="stream-settings-menu__input-wrapper">
              <Tag class="stream-settings-menu__input-icon--small" />
              <input
                :value="newRoomId"
                placeholder="Channel"
                class="stream-settings-menu__input"
                @input="
                  $emit(
                    'update:newRoomId',
                    ($event.target as HTMLInputElement).value,
                  )
                "
              />
            </div>
          </div>
          <button
            class="stream-settings-menu__subscribe-button"
            :class="
              newEvent.trim()
                ? 'stream-settings-menu__subscribe-button--enabled'
                : 'stream-settings-menu__subscribe-button--disabled'
            "
            :disabled="!newEvent.trim()"
            @click.stop="$emit('subscribeToEvent')"
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stream-settings-menu__dropdown {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: var(--spacing-1);
  z-index: 100;
  width: 16rem;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}

.stream-settings-menu__content {
  padding: var(--spacing-3);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.stream-settings-menu__row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.stream-settings-menu__icon-container {
  display: flex;
  align-items: center;
  padding: var(--spacing-1-5) 0;
  flex-shrink: 0;
}

.stream-settings-menu__icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
}

.stream-settings-menu__label {
  font-size: 0.75rem;
  font-family: var(--font-mono);
  color: var(--color-fg-muted);
}

.stream-settings-menu__toggle-group {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.stream-settings-menu__toggle {
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.stream-settings-menu__toggle--active {
  background-color: var(--color-accent-primary);
  color: var(--color-fg-inverse);
}

.stream-settings-menu__toggle--inactive {
  background-color: var(--color-bg-tertiary);
  color: var(--color-fg-muted);
  border: 1px solid var(--color-divider);
}

.stream-settings-menu__toggle--inactive:hover {
  color: var(--color-accent-primary);
}

.stream-settings-menu__description {
  font-size: 10px;
  color: var(--color-fg-muted);
  line-height: 1.25;
  user-select: none;
}

.stream-settings-menu__divider {
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-accent-primary) 20%, transparent);
}

.stream-settings-menu__input-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

.stream-settings-menu__input-wrapper {
  position: relative;
  flex: 1;
  min-width: 0;
}

.stream-settings-menu__input-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-fg-muted);
  position: absolute;
  left: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.stream-settings-menu__input-icon--small {
  width: 0.875rem;
  height: 0.875rem;
  color: var(--color-fg-muted);
  position: absolute;
  left: var(--spacing-2);
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
}

.stream-settings-menu__input {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  padding-left: 1.75rem;
  font-size: 0.75rem;
  font-family: var(--font-mono);
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-divider);
  color: var(--color-fg-secondary);
  outline: none;
}

.stream-settings-menu__input::placeholder {
  color: var(--color-fg-muted);
}

.stream-settings-menu__input:focus {
  border-color: var(--color-accent-primary);
}

.stream-settings-menu__subscribe-button {
  width: 100%;
  padding: var(--spacing-1-5) var(--spacing-3);
  font-size: 0.75rem;
  font-family: var(--font-mono);
  transition:
    color 0.2s ease,
    background-color 0.2s ease,
    border-color 0.2s ease;
}

.stream-settings-menu__subscribe-button--enabled {
  color: var(--color-fg-inverse);
  background-color: var(--color-accent-primary);
  cursor: pointer;
}

.stream-settings-menu__subscribe-button--enabled:hover {
  opacity: 0.9;
}

.stream-settings-menu__subscribe-button--disabled {
  color: var(--color-fg-muted);
  background-color: var(--color-bg-tertiary);
  cursor: not-allowed;
}
</style>
