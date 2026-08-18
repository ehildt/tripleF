<script setup lang="ts">
import { Network, Radio, RadioTower, Tag } from '@lucide/vue';
import { computed, ref } from 'vue';

import IconButton from '../../../shared/ui/icon-button/IconButton.vue';
import { useMenuPosition } from '../model-selector/composables/use-menu-position';
import ToolbarLabel from '../shared/ui/toolbar-label/ToolbarLabel.vue';

const props = defineProps<{
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

// Same as the model-select and new-conversation popovers: teleport to <body>
// with a fixed position so the dropdown stays above the lifted chat column
// (z-60) and the floating video popouts (z-1000) instead of being capped
// inside the sticky toolbar's stacking context (z-50).
const triggerRef = ref<HTMLElement | null>(null);
const isOpenRef = computed(() => props.isOpen);
const { positionStyle } = useMenuPosition(triggerRef, isOpenRef);

/** Hover hints (brain blink on the model selector) only make sense while the
 *  menu is disabled — an enabled menu needs no "select a model first" cue. */
function onIconMouseEnter() {
  if (props.isDisabled) props.onMouseEnter?.();
}

function onIconMouseLeave() {
  if (props.isDisabled) props.onMouseLeave?.();
}
</script>

<template>
  <div class="flex items-center gap-1.5 w-full justify-end">
    <ToolbarLabel value="sockets" translate />
    <div ref="triggerRef" class="relative shrink-0">
      <IconButton
        :active="isOpen"
        :disabled="isDisabled"
        :blinking="blinking?.value"
        :title="$t('common.streamTitle')"
        @mouseenter="onIconMouseEnter"
        @mouseleave="onIconMouseLeave"
        @click.stop="$emit('toggleMenu')"
      >
        <Network />
      </IconButton>
      <Teleport to="body">
        <div
          v-if="isOpen"
          class="stream-settings-menu__dropdown"
          data-toolbar-menu-dropdown
          :style="positionStyle ?? undefined"
          @click.stop
        >
          <div class="stream-settings-menu__content">
            <div class="stream-settings-menu__row">
              <span class="stream-settings-menu__icon-container">
                <RadioTower class="stream-settings-menu__icon" />
              </span>
              <span class="stream-settings-menu__label">{{
                $t('common.stream')
              }}</span>
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
                  {{ $t('common.streamWord') }}
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
                  {{ $t('common.streamText') }}
                </button>
              </div>
            </div>
            <div class="stream-settings-menu__description">
              <template v-if="isStreamEnabled">{{
                $t('common.streamRealTime')
              }}</template>
              <template v-else>{{ $t('common.streamRendersOnce') }}</template>
            </div>
            <div class="stream-settings-menu__divider"></div>
            <div class="stream-settings-menu__input-row">
              <div class="stream-settings-menu__input-wrapper">
                <Radio class="stream-settings-menu__input-icon" />
                <input
                  :value="newEvent"
                  name="stream-event"
                  :placeholder="$t('common.socket')"
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
                  name="stream-channel"
                  :placeholder="$t('common.channel')"
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
      </Teleport>
    </div>
  </div>
</template>

<style scoped>
.stream-settings-menu__dropdown {
  /* Teleported to <body>: above the lifted chat column (z-60) and the
     floating video popouts (z-1000), below the lightbox (z-1100) — same
     layer as the model-select and new-conversation popovers. Position comes
     from the trigger anchor inline style. */
  position: fixed;
  z-index: 1050;
  margin-left: var(--spacing-1);
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
  cursor: default;
}
</style>
