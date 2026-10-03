<script setup lang="ts">
import { computed, ref } from 'vue';

import IconButton from '@/components/shared/ui/icon-button/IconButton.vue';
import { useMenuPosition } from '@/composables/use-menu-position';

import type { ToolbarMenuTriggerProps } from './ToolbarMenuTrigger.types';

const props = withDefaults(defineProps<ToolbarMenuTriggerProps>(), {
  dropdownWidth: '14rem',
});

const emit = defineEmits<{
  toggleMenu: [];
  close: [];
  mouseenter: [];
  mouseleave: [];
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

/** Hover hints (brain blink) only make sense while the trigger is disabled —
 *  an enabled menu needs no "select a model first" cue. */
function onIconMouseEnter() {
  if (props.isDisabled) emit('mouseenter');
}

function onIconMouseLeave() {
  if (props.isDisabled) emit('mouseleave');
}
</script>

<template>
  <div ref="triggerRef" class="toolbar-menu-trigger">
    <IconButton
      size="sm"
      :active="isOpen"
      :disabled="isDisabled"
      :blinking="blinking"
      :title="title"
      @mouseenter="onIconMouseEnter"
      @mouseleave="onIconMouseLeave"
      @click.stop="emit('toggleMenu')"
    >
      <component :is="triggerIcon" />
    </IconButton>
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

.toolbar-menu-trigger__backdrop {
  position: fixed;
  inset: 0;
  /* Below the sticky toolbars (z-50) so chrome stays clickable while the
     menu is open; still above the main content to catch outside clicks. */
  z-index: 40;
}

.toolbar-menu-trigger__dropdown {
  /* Teleported to <body>: above the chat column (z-60) and the floating
     video popouts (z-1000), below the lightbox (1100) — same layer as the
     model-select menu. Position comes from the trigger anchor inline style
     (anchored above the trigger). */
  position: fixed;
  z-index: 1050;
  background-color: var(--color-bg-elevated);
  border: 1px solid var(--color-divider);
  box-shadow: 0 10px 15px -3px
    color-mix(in srgb, var(--color-bg-primary) 10%, transparent);
}
</style>
