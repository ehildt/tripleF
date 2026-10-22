<script setup lang="ts">
import { computed, ref } from 'vue';

import MotionIcon from '@/components/shared/ui/motion-icon/MotionIcon.vue';
import Tooltip from '@/components/shared/ui/tooltip/Tooltip.vue';
import { useMenuPosition } from '@/composables/use-menu-position';

import type { ToolbarMenuTriggerProps } from './ToolbarMenuTrigger.types';

const props = withDefaults(defineProps<ToolbarMenuTriggerProps>(), {
  isDisabled: false,
  blinking: false,
  dropdownWidth: '14rem',
});

const emit = defineEmits<{
  toggleMenu: [];
  close: [];
}>();

const triggerRef = ref<HTMLElement | null>(null);
const { positionStyle } = useMenuPosition(
  triggerRef,
  computed(() => props.isOpen),
  // Prompt-bar triggers sit at the bottom of the viewport: the menus open
  // upward instead of floating down over the bar.
  { side: 'above' },
);

const dropdownStyle = computed(() => ({
  ...positionStyle.value,
  width: props.dropdownWidth,
}));
</script>

<template>
  <div ref="triggerRef" class="toolbar-menu-trigger">
    <!-- The tooltip keeps working while the button is enabled; a disabled
         trigger (no model selected) suppresses it, matching the strip's
         other menus. -->
    <Tooltip :text="title" :disabled="isDisabled">
      <button
        type="button"
        class="toolbar-menu-trigger__button"
        :class="{ 'toolbar-menu-trigger__button--blinking': blinking }"
        :aria-label="title"
        :aria-expanded="isOpen"
        :disabled="isDisabled"
        @click.stop="emit('toggleMenu')"
      >
        <MotionIcon>
          <component
            :is="triggerIcon"
            class="toolbar-menu-trigger__icon"
            aria-hidden="true"
          />
        </MotionIcon>
      </button>
    </Tooltip>
    <Teleport to="body">
      <!-- The transparent backdrop carries the close intent: the first
           outside click dismisses the menu (slide-over/lightbox pattern). -->
      <div
        v-if="isOpen"
        class="toolbar-menu-trigger__backdrop"
        @click="emit('close')"
      />
      <div
        v-if="isOpen"
        class="toolbar-menu-trigger__dropdown"
        :style="dropdownStyle"
        @click.stop
      >
        <slot />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.toolbar-menu-trigger {
  position: relative;
  flex-shrink: 0;
}

/* The trigger mirrors the view-menu's ghost-icon recipe so the prompt menus
   read as one menu family with the strips on the right of the bar: a bare
   button, a 0.8rem icon in a saturated hue at rest that lightens toward
   white on hover (or while its menu is open), and the MotionIcon
   micro-interaction. The accent hue marks the prompt controls; a disabled
   trigger (no model selected) recedes into the muted tone. */
.toolbar-menu-trigger__button {
  display: inline-flex;
  align-items: center;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  color: var(--color-accent-primary);
  transition: color 0.2s ease;
}

.toolbar-menu-trigger__button:hover:not(:disabled),
.toolbar-menu-trigger__button[aria-expanded='true'] {
  color: color-mix(in srgb, var(--color-accent-primary) 60%, white);
}

.toolbar-menu-trigger__button:disabled {
  color: var(--color-fg-muted);
  cursor: default;
}

/* Attention blink for the "nothing selected yet" state: the same calm 2s
   opacity breathing the shared input-select uses. A disabled trigger (e.g.
   the chat menu while no model is picked) never blinks — a control must not
   invite a click it refuses. */
.toolbar-menu-trigger__button--blinking {
  animation: toolbar-menu-trigger-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.toolbar-menu-trigger__button--blinking:disabled {
  animation: none;
}

@media (prefers-reduced-motion: reduce) {
  .toolbar-menu-trigger__button--blinking {
    animation: none;
  }
}

/* Scoped (auto-renamed by Vue) so the pulse never depends on a global
   keyframes definition being present. */
@keyframes toolbar-menu-trigger-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.toolbar-menu-trigger__icon {
  width: 0.8rem;
  height: 0.8rem;
}

.toolbar-menu-trigger__backdrop {
  position: fixed;
  inset: 0;
  /* Below the sticky toolbars (z-50) so chrome stays clickable while the
     menu is open; still above the main content to catch outside clicks. */
  z-index: 40;
}

.toolbar-menu-trigger__dropdown {
  /* Teleported to <body>: above the chat column (z-60) and the floating
     video popouts (z-1000), below the lightbox (1100). Position comes from
     the trigger anchor inline style (anchored above the trigger). */
  position: fixed;
  z-index: 1050;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
